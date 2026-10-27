import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { getFeed } from '@/entities/meeting/api/read';
import { loadConversation, loadOlderConversation } from '@/entities/meeting/model/loadConversation';
import { shareConversation } from '@/entities/meeting/model/shareConversation';
import { privateKey, resetAccess, denyAccess } from '@/entities/meeting/model/access';
import { resetSession } from '@/entities/session/model/resetSession';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import type { Conversation } from '@/entities/meeting/model/types';
import { entry, page, deferredPage } from '@/entities/meeting/model/tests/conversationFixture';
vi.mock('@/entities/meeting/api/read', () => ({getFeed: vi.fn()}));
let client: QueryClient;
const key = privateKey('A', 'M', 0, 'feed');
const read = () => client.fetchQuery({queryKey: key, structuralSharing: shareConversation, queryFn: ({signal}) => loadConversation(client, 'A', 'M', 0, signal)});
const seed = (cursor='100') => client.setQueryData<Conversation>(key, {...page([cursor]), receiveCursor: cursor, hasOlder: true});
const sequences = () => client.getQueryData<Conversation>(key)?.entries.map(value => value.sequence);
beforeEach(() => {client = new QueryClient({defaultOptions: {queries: {retry: false, staleTime: 0}}}); resetAccess(); vi.mocked(getFeed).mockReset();});
afterEach(() => client.clear());
describe('independent integration checks for receive cursor', () => {
 it('cancel on page two preserves confirmed cursor and ACK, then retries after the confirmed cursor', async () => {
  seed();
  const gate = deferredPage();
  vi.mocked(getFeed).mockResolvedValueOnce(page(['101'], true)).mockReturnValueOnce(gate.promise);
  const pending = read();
  await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(2));
  client.setQueryData<Conversation>(key, current => current && {...current, entries: mergeEntries(current.entries, [entry('103')])});
  await client.cancelQueries({queryKey:key}); gate.resolve(page(['102'])); await pending.catch(() => undefined);
  expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('100');
  expect(sequences()).toEqual(['100','103']);
  vi.mocked(getFeed).mockResolvedValueOnce(page(['101','102','103']));
  await read();
  expect(getFeed).toHaveBeenLastCalledWith('M',{after:'100'},expect.any(AbortSignal));
  expect(sequences()).toEqual(['100','101','102','103']);
 });
 it('empty intermediate has_more is rejected atomically with no cursor advancement', async () => {
  seed(); vi.mocked(getFeed).mockResolvedValueOnce(page(['101'],true)).mockResolvedValueOnce(page([],true));
  await expect(read()).rejects.toThrow('Feed page did not advance');
  expect(sequences()).toEqual(['100']);
  expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('100');
 });
 it('a completed concurrent history load survives final QueryClient commit without moving receive cursor', async () => {
  seed(); const forward = deferredPage();
  vi.mocked(getFeed).mockReturnValueOnce(forward.promise).mockResolvedValueOnce(page(['90','99'], false));
  const pending = read(); await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(1));
  await loadOlderConversation(client,'A','M',0);
  forward.resolve(page(['101'])); await pending;
  expect(sequences()).toEqual(['90','99','100','101']);
  expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('101');
  expect(client.getQueryData<Conversation>(key)?.hasOlder).toBe(false);
 });
 it('late receive after reset does not write either old user or new user cache', async () => {
  seed(); const gate = deferredPage(); vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
  const pending=read();
  await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(1));
  resetSession(client); resetAccess();
  const other=privateKey('X','M',0,'feed');
  client.setQueryData(other,{...page(['500']),receiveCursor:'500',hasOlder:false});
  gate.resolve(page(['101'])); await pending.catch(() => undefined); await Promise.resolve();
  expect(client.getQueryData(key)).toBeUndefined();
  expect(client.getQueryData<Conversation>(other)?.receiveCursor).toBe('500');
 });
 it('old history response is discarded if a new session for the same user has already loaded M', async () => {
  seed(); const gate=deferredPage(); vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
  const pending=loadOlderConversation(client,'A','M',0);
  await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(1));
  resetSession(client); resetAccess();
  seed('200');
  gate.resolve(page(['90','99'],false));
  await pending.catch(() => false);
  expect(sequences()).toEqual(['200']);
  expect(client.getQueryData<Conversation>(key)?.hasOlder).toBe(true);
 });
 it('history exhaustion arriving between loader return and cache commit stays exhausted', async () => {
  seed(); vi.mocked(getFeed).mockResolvedValueOnce(page(['101']));
  await client.fetchQuery({queryKey:key,structuralSharing:shareConversation,queryFn:async ({signal}) => {
   const result=await loadConversation(client,'A','M',0,signal);
   queueMicrotask(() => client.setQueryData<Conversation>(key,current => current && {...current,entries:mergeEntries([entry('90')],current.entries),hasOlder:false}));
   return result;
  }});
  expect(sequences()).toEqual(['90','100','101']);
  expect(client.getQueryData<Conversation>(key)?.hasOlder).toBe(false);
 });
 it('revoking one meeting during a page chain leaves a second meeting intact', async () => {
  seed(); const other=privateKey('A','N',0,'feed'); client.setQueryData(other,{value:'retained'});
  const gate=deferredPage(); vi.mocked(getFeed).mockResolvedValueOnce(page(['101'],true)).mockReturnValueOnce(gate.promise);
  const pending=read();
  await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(2));
  denyAccess(client,'A','M',0); gate.resolve(page(['102'])); await pending.catch(() => undefined);
  expect(client.getQueryData(key)).toBeUndefined(); expect(client.getQueryData(other)).toEqual({value:'retained'});
 });
});
