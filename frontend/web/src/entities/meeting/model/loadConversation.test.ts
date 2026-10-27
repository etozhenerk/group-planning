import { shareConversation } from '@/entities/meeting/model/shareConversation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { getFeed } from '@/entities/meeting/api/read';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import { accessEpoch, privateKey, resetAccess } from '@/entities/meeting/model/access';
import {
  loadConversation,
  loadOlderConversation,
} from '@/entities/meeting/model/loadConversation';
import {
  deferredPage,
  entry,
  page,
} from '@/entities/meeting/model/tests/conversationFixture';
import type { Conversation } from '@/entities/meeting/model/types';

vi.mock('@/entities/meeting/api/read', () => ({ getFeed: vi.fn() }));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
let epoch = accessEpoch('user', 'meeting');
let key = privateKey('user', 'meeting', epoch, 'feed');
const read = async () => {
  await client.invalidateQueries({ queryKey: key, refetchType: 'none' });

  return client.fetchQuery({
    queryKey: key,
    structuralSharing: shareConversation,
    queryFn: ({ signal }) => loadConversation(client, 'user', 'meeting', epoch, signal),
  });
};

const receive = async (sequences: string[]) => {
  vi.mocked(getFeed).mockResolvedValueOnce(page(sequences));

  return read();
};

const ack = (sequence: string) =>
  client.setQueryData<Conversation>(
    key,
    (current) =>
      current && {
        ...current,
        entries: mergeEntries(current.entries, [entry(sequence)]),
      },
  );

beforeEach(() => {
  vi.mocked(getFeed).mockReset();
  resetAccess();
  epoch = accessEpoch('user', 'meeting');
  key = privateKey('user', 'meeting', epoch, 'feed');
});
afterEach(() => client.clear());

describe('confirmed receive cursor with QueryClient and controlled transport', () => {
  it('fetches foreign 101 after own ACK 102, applies the complete chain and keeps one 102', async () => {
    await receive(['100']);
    ack('102');
    expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('100');
    vi.mocked(getFeed)
      .mockResolvedValueOnce(page(['101'], true))
      .mockResolvedValueOnce(page(['102']));
    const result = await read();
    expect(getFeed).toHaveBeenNthCalledWith(
      2,
      'meeting',
      { after: '100' },
      expect.any(AbortSignal),
    );
    expect(getFeed).toHaveBeenNthCalledWith(
      3,
      'meeting',
      { after: '101' },
      expect.any(AbortSignal),
    );
    expect(result.entries.map((value) => value.sequence)).toEqual(['100', '101', '102']);
    expect(result.receiveCursor).toBe('102');
    expect(result.latestSequence).toBe('999');
  });

  it('preserves an ACK arriving during GET without confirming it as received', async () => {
    await receive(['100']);
    const gate = deferredPage();
    vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
    const pending = read();
    await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(2));
    ack('102');
    gate.resolve(page(['101']));
    const result = await pending;
    expect(result.entries.map((value) => value.sequence)).toEqual(['100', '101', '102']);
    expect(result.receiveCursor).toBe('101');
    await receive(['102']);
    expect(getFeed).toHaveBeenLastCalledWith(
      'meeting',
      { after: '101' },
      expect.any(AbortSignal),
    );
  });

  it('preserves a late ACK between the reader result and Tanstack cache commit', async () => {
    await receive(['100']);
    vi.mocked(getFeed).mockResolvedValueOnce(page(['101']));
    await client.invalidateQueries({ queryKey: key, refetchType: 'none' });
    let acknowledged = false;
    const observed: string[][] = [];
    const unsubscribe = client.getQueryCache().subscribe(() => {
      if (acknowledged) {
        observed.push(
          client
            .getQueryData<Conversation>(key)
            ?.entries.map((value) => value.sequence) ?? [],
        );
      }
    });

    await client.fetchQuery({
      queryKey: key,
      structuralSharing: shareConversation,
      queryFn: async ({ signal }) => {
        const result = await loadConversation(client, 'user', 'meeting', epoch, signal);
        queueMicrotask(() => {
          acknowledged = true;
          ack('102');
        });

        return result;
      },
    });
    unsubscribe();
    expect(acknowledged).toBe(true);
    expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('101');
    expect(observed.every((sequences) => sequences.includes('102'))).toBe(true);
    expect(
      client.getQueryData<Conversation>(key)?.entries.map((value) => value.sequence),
    ).toEqual(['100', '101', '102']);
  });

  it('starts an empty initial result at zero and ignores tail metadata', async () => {
    expect((await receive([])).receiveCursor).toBe('0');
    const result = await receive(['1']);
    expect(getFeed).toHaveBeenNthCalledWith(1, 'meeting', {}, expect.any(AbortSignal));
    expect(getFeed).toHaveBeenNthCalledWith(
      2,
      'meeting',
      { after: '0' },
      expect.any(AbortSignal),
    );
    expect(result.receiveCursor).toBe('1');
  });

  it('keeps initial has_more as history rather than draining after the tail', async () => {
    vi.mocked(getFeed).mockResolvedValueOnce(page(['51', '100'], true));
    const result = await read();
    expect(getFeed).toHaveBeenCalledTimes(1);
    expect(result.receiveCursor).toBe('100');
    expect(result.hasOlder).toBe(true);
  });

  it('does not advance the receive cursor when loading before, replaying a page or getting an empty after', async () => {
    await receive(['100']);
    vi.mocked(getFeed).mockResolvedValueOnce(page(['90', '99'], true));
    await loadOlderConversation(client, 'user', 'meeting', epoch);
    expect(getFeed).toHaveBeenNthCalledWith(2, 'meeting', { before: '100' }, undefined);
    expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('100');
    const duplicate = await receive(['100']);
    expect(duplicate.entries.map((value) => value.sequence)).toEqual(['90', '99', '100']);
    expect((await receive([])).receiveCursor).toBe('100');
  });

  it('leaves received data and cursor atomic when the second page fails, then retries from 100', async () => {
    await receive(['100']);
    ack('102');
    vi.mocked(getFeed)
      .mockResolvedValueOnce(page(['101'], true))
      .mockRejectedValueOnce(new Error('page failed'));
    await expect(read()).rejects.toThrow('page failed');
    const current = client.getQueryData<Conversation>(key);
    expect(current?.receiveCursor).toBe('100');
    expect(current?.entries.map((value) => value.sequence)).toEqual(['100', '102']);
    const result = await receive(['101', '102']);
    expect(getFeed).toHaveBeenLastCalledWith(
      'meeting',
      { after: '100' },
      expect.any(AbortSignal),
    );
    expect(result.receiveCursor).toBe('102');
  });

  it('preserves decimal uint64 values above the safe integer range', async () => {
    await receive(['18446744073709551613']);
    ack('18446744073709551615');
    const result = await receive(['18446744073709551614', '18446744073709551615']);
    expect(getFeed).toHaveBeenLastCalledWith(
      'meeting',
      { after: '18446744073709551613' },
      expect.any(AbortSignal),
    );
    expect(result.entries.map((value) => value.sequence)).toEqual([
      '18446744073709551613',
      '18446744073709551614',
      '18446744073709551615',
    ]);
    expect(result.receiveCursor).toBe('18446744073709551615');
  });

  it('retains the cursor when application of a response throws', async () => {
    await receive(['100']);
    vi.mocked(getFeed).mockResolvedValueOnce(page(['invalid-sequence']));
    await expect(read()).rejects.toThrow();
    expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('100');
    expect(
      client.getQueryData<Conversation>(key)?.entries.map((value) => value.sequence),
    ).toEqual(['100']);
  });

  it('fails a non-advancing has_more chain instead of looping or confirming a partial page', async () => {
    await receive(['100']);
    vi.mocked(getFeed)
      .mockResolvedValueOnce(page(['101'], true))
      .mockResolvedValueOnce(page(['101'], true));
    await expect(read()).rejects.toThrow('Feed page did not advance');
    expect(getFeed).toHaveBeenCalledTimes(3);
    expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('100');
  });
});
