import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getFeed } from '@/entities/meeting/api/read';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import {
  accessEpoch,
  applyResponse,
  privateKey,
  resetAccess,
} from '@/entities/meeting/model/access';
import {
  loadConversation,
  loadOlderConversation,
} from '@/entities/meeting/model/loadConversation';
import { shareConversation } from '@/entities/meeting/model/shareConversation';
import {
  deferredPage,
  entry,
  page,
} from '@/entities/meeting/model/tests/conversationFixture';
import type { Conversation } from '@/entities/meeting/model/types';
import { resetSession } from '@/entities/session/model/resetSession';

vi.mock('@/entities/meeting/api/read', () => ({ getFeed: vi.fn() }));

const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const seed = (sequence: string, user = 'user') => {
  const epoch = accessEpoch(user, 'meeting');
  const key = privateKey(user, 'meeting', epoch, 'feed');
  const data: Conversation = {
    ...page([sequence]),
    receiveCursor: sequence,
    hasOlder: true,
  };

  client.setQueryData(key, data);

  return { key, epoch, data };
};

beforeEach(() => {
  resetAccess();
  vi.mocked(getFeed).mockReset();
});
afterEach(() => client.clear());

describe('history cache and session races', () => {
  it('preserves history exhaustion between loader return and cache commit', async () => {
    const { key, epoch } = seed('100');
    vi.mocked(getFeed).mockResolvedValueOnce(page(['101']));
    await client.fetchQuery({
      queryKey: key,
      structuralSharing: shareConversation,
      queryFn: async ({ signal }) => {
        const result = await loadConversation(client, 'user', 'meeting', epoch, signal);
        queueMicrotask(() =>
          client.setQueryData<Conversation>(
            key,
            (current) =>
              current && {
                ...current,
                entries: mergeEntries([entry('90')], current.entries),
                hasOlder: false,
              },
          ),
        );

        return result;
      },
    });
    const current = client.getQueryData<Conversation>(key);
    expect(current?.entries.map((value) => value.sequence)).toEqual(['90', '100', '101']);
    expect(current?.receiveCursor).toBe('101');
    expect(current?.hasOlder).toBe(false);
  });

  it.each(['user', 'other-user'])(
    'rejects old history after reset and a new session for %s',
    async (nextUser) => {
      const previous = seed('100');
      const gate = deferredPage();
      vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
      const pending = loadOlderConversation(client, 'user', 'meeting', previous.epoch);
      const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
      resetSession(client);
      resetAccess();
      const next = seed('200', nextUser);
      gate.resolve(page(['90', '99']));
      await rejected;
      expect(client.getQueryData(previous.key)).toBeUndefined();
      expect(client.getQueryData(next.key)).toEqual(next.data);
      expect(next.epoch).toBeGreaterThan(previous.epoch);
    },
  );

  it('checks the lease again between guarded history return and cache commit', async () => {
    const previous = seed('100');
    vi.mocked(getFeed).mockResolvedValueOnce(page(['90']));
    const pending = loadOlderConversation(client, 'user', 'meeting', previous.epoch);
    const rejected = expect(pending).rejects.toMatchObject({ name: 'AbortError' });
    queueMicrotask(() => {
      resetSession(client);
      resetAccess();
      seed('200');
    });
    await rejected;
    const nextKey = privateKey('user', 'meeting', accessEpoch('user', 'meeting'), 'feed');
    expect(client.getQueryData(previous.key)).toBeUndefined();
    expect(client.getQueryData<Conversation>(nextKey)?.receiveCursor).toBe('200');
    expect(client.getQueryData<Conversation>(nextKey)?.hasOlder).toBe(true);
  });

  it('never reuses a prior access lease after resets and RSVP transitions', () => {
    const leases = [accessEpoch('user', 'meeting')];

    for (let revision = 1; revision <= 3; revision += 1) {
      applyResponse(
        client,
        'user',
        {
          meetingId: 'meeting',
          answer: 'going',
          revision: String(revision),
          canAccess: true,
          meetingRevision: String(revision),
        },
        accessEpoch('user', 'meeting'),
      );
      leases.push(accessEpoch('user', 'meeting'));
    }

    resetAccess();
    leases.push(accessEpoch('user', 'meeting'));
    resetAccess();
    leases.push(accessEpoch('user', 'meeting'));
    expect(new Set(leases).size).toBe(leases.length);
    expect(leases).toEqual([...leases].sort((left, right) => left - right));
  });
});
