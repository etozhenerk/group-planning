import * as projections from '@/entities/meeting/model/applyChatProjections';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import {
  getChatCapabilities,
  getChatChanges,
  getChatSnapshot,
} from '@/entities/meeting/api/chat';
import { getFeed } from '@/entities/meeting/api/read';
import { loadChat } from '@/entities/meeting/model/loadChat';
import { accessEpoch, privateKey, resetAccess } from '@/entities/meeting/model/access';
import { chatChanges, chatSnapshot } from '@/entities/meeting/model/tests/chatFixture';
import { page } from '@/entities/meeting/model/tests/conversationFixture';
import type { Conversation } from '@/entities/meeting/model/types';

vi.mock('@/entities/meeting/api/chat', () => ({
  getChatCapabilities: vi.fn(),
  getChatChanges: vi.fn(),
  getChatSnapshot: vi.fn(),
}));
vi.mock('@/entities/meeting/api/read', () => ({ getFeed: vi.fn() }));
let client: QueryClient;
const key = () => privateKey('user', 'meeting', accessEpoch('user', 'meeting'), 'feed');
const load = () => loadChat(client, 'user', 'meeting', accessEpoch('user', 'meeting'));
beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  resetAccess();
  vi.resetAllMocks();
  vi.mocked(getChatCapabilities).mockResolvedValue({
    protocol_version: 1,
    sync: true,
    realtime: true,
    read_state: false,
  });
  vi.mocked(getChatSnapshot).mockResolvedValue(chatSnapshot());
});
afterEach(() => client.clear());

it('uses snapshot and then the confirmed cursor, committing each bounded page before the next', async () => {
  await load();
  vi.mocked(getChatChanges)
    .mockResolvedValueOnce(chatChanges('101', true))
    .mockImplementationOnce((_id, cursor) => {
      expect(cursor).toBe('cursor:101');
      expect(client.getQueryData<Conversation>(key())).toMatchObject({
        sync: { cursor: 'cursor:101' },
        entries: [{ id: '100' }, { id: '101' }],
      });

      return Promise.resolve(chatChanges('102'));
    });
  const result = await load();
  expect(result.entries.map((entry) => entry.id)).toEqual(['100', '101', '102']);
  expect(result.receiveCursor).toBe('0');
  expect(result.sync?.cursor).toBe('cursor:102');
  expect(getFeed).not.toHaveBeenCalled();
});

it('retains the last atomically applied page after a failure and resumes from it', async () => {
  await load();
  vi.mocked(getChatChanges)
    .mockResolvedValueOnce(chatChanges('101', true))
    .mockRejectedValueOnce(new TypeError('lost page'));
  await expect(load()).rejects.toThrow('lost page');
  expect(client.getQueryData<Conversation>(key())?.sync?.cursor).toBe('cursor:101');
  vi.mocked(getChatChanges).mockResolvedValueOnce(chatChanges('102'));
  await load();
  expect(getChatChanges).toHaveBeenLastCalledWith('meeting', 'cursor:101', undefined);
});

it('replaces invalidated history and handles 410 with a fresh authorized snapshot', async () => {
  await load();
  vi.mocked(getChatSnapshot).mockResolvedValueOnce(chatSnapshot('200'));
  vi.mocked(getChatChanges)
    .mockRejectedValueOnce(new ApiError(410, 'sync_reset_required'))
    .mockResolvedValueOnce({ ...chatChanges('200'), changes: [] });
  const reset = await load();
  expect(reset.entries.map((entry) => entry.id)).toEqual(['200']);
  expect(reset.sync?.cursor).toBe('cursor:200');
  expect(getChatChanges).toHaveBeenLastCalledWith('meeting', 'cursor:200', undefined);
  const invalidation = chatChanges('201');
  invalidation.changes = [{ kind: 'history_invalidated', projection_version: '201' }];
  vi.mocked(getChatChanges).mockResolvedValueOnce(invalidation);
  vi.mocked(getChatSnapshot).mockResolvedValueOnce(chatSnapshot('300'));
  vi.mocked(getChatChanges).mockResolvedValueOnce({ ...chatChanges('300'), changes: [] });
  expect((await load()).entries.map((entry) => entry.id)).toEqual(['300']);
});

it('rejects changing through barriers and non-advancing pages without committing them', async () => {
  await load();
  const changed = chatChanges('102');
  changed.through_cursor = 'other';
  vi.mocked(getChatChanges)
    .mockResolvedValueOnce(chatChanges('101', true))
    .mockResolvedValueOnce(changed);
  await expect(load()).rejects.toThrow('Invalid sync boundary');
  expect(client.getQueryData<Conversation>(key())?.sync?.cursor).toBe('cursor:101');
  vi.mocked(getChatChanges).mockResolvedValueOnce(chatChanges('101', true));
  await expect(load()).rejects.toThrow('Invalid sync boundary');
});

it('does not apply a response from an older account/access generation', async () => {
  const previousKey = key();
  const gate: {
    resolve: ((snapshot: ReturnType<typeof chatSnapshot>) => void) | undefined;
  } = { resolve: undefined };

  vi.mocked(getChatSnapshot).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        gate.resolve = resolve;
      }),
  );
  const pending = load();
  await vi.waitFor(() => expect(getChatSnapshot).toHaveBeenCalled());
  resetAccess();
  gate.resolve?.(chatSnapshot());
  await expect(pending).rejects.toThrow('Stale access');
  expect(client.getQueryData(previousKey)).toBeUndefined();
});

it('keeps the legacy HTTP path when sync capability is disabled', async () => {
  vi.mocked(getChatCapabilities).mockResolvedValue({
    protocol_version: 1,
    sync: false,
    realtime: false,
    read_state: false,
  });
  vi.mocked(getFeed).mockResolvedValue(page(['100']));
  const result = await load();
  expect(result.receiveCursor).toBe('100');
  expect(result.sync).toBeUndefined();
  expect(getChatSnapshot).not.toHaveBeenCalled();
});

it('keeps the committed cursor when applying a current resource projection fails', async () => {
  await load();
  vi.mocked(getChatChanges).mockResolvedValueOnce(chatChanges('101'));
  const applying = vi
    .spyOn(projections, 'applyChatProjections')
    .mockImplementationOnce(() => {
      throw new Error('apply failure');
    });

  await expect(load()).rejects.toThrow('apply failure');
  expect(client.getQueryData<Conversation>(key())?.sync?.cursor).toBe('cursor:100');
  expect(
    client.getQueryData<Conversation>(key())?.entries.map((entry) => entry.id),
  ).toEqual(['100']);
  applying.mockRestore();
});

it('retains new foreign-message counts when a membership invalidation requires a snapshot', async () => {
  await load();
  const incoming = chatChanges('101');
  incoming.changes[0]!.projection!.entry!.actor.id = 'friend';
  incoming.changes.unshift({ kind: 'history_invalidated', projection_version: '101' });
  vi.mocked(getChatChanges)
    .mockResolvedValueOnce(incoming)
    .mockResolvedValueOnce({ ...chatChanges('101'), changes: [] });
  vi.mocked(getChatSnapshot).mockResolvedValueOnce(chatSnapshot('101'));
  const result = await load();
  expect(result.newMessages).toBe(1);
  expect(result.sync?.cursor).toBe('cursor:101');
});
