import { shareConversation } from '@/entities/meeting/model/shareConversation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { getFeed } from '@/entities/meeting/api/read';
import {
  accessEpoch,
  applyResponse,
  denyAccess,
  privateKey,
  resetAccess,
} from '@/entities/meeting/model/access';
import {
  loadConversation,
  loadOlderConversation,
} from '@/entities/meeting/model/loadConversation';
import { deferredPage, page } from '@/entities/meeting/model/tests/conversationFixture';
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

beforeEach(() => {
  vi.mocked(getFeed).mockReset();
  resetAccess();
  epoch = accessEpoch('user', 'meeting');
  key = privateKey('user', 'meeting', epoch, 'feed');
});
afterEach(() => client.clear());

describe('receive cursor access lease', () => {
  it('does not resurrect a revoked cache when the transport returns late', async () => {
    const gate = deferredPage();
    vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
    const pending = read();
    const rejected = expect(pending).rejects.toThrow();
    await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(1));
    denyAccess(client, 'user', 'meeting', epoch);
    gate.resolve(page(['100']));
    await rejected;
    expect(client.getQueryData(key)).toBeUndefined();
    expect(accessEpoch('user', 'meeting')).toBeGreaterThan(epoch);
  });

  it('does not replace a new lease or another account with an old response', async () => {
    const gate = deferredPage();
    vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
    const pending = read();
    const rejected = expect(pending).rejects.toThrow();
    await vi.waitFor(() => expect(getFeed).toHaveBeenCalledTimes(1));
    applyResponse(
      client,
      'user',
      {
        meetingId: 'meeting',
        answer: 'going',
        revision: '2',
        canAccess: true,
        meetingRevision: '2',
      },
      epoch,
    );
    const nextKey = privateKey('user', 'meeting', accessEpoch('user', 'meeting'), 'feed');
    const otherKey = privateKey(
      'other-user',
      'meeting',
      accessEpoch('other-user', 'meeting'),
      'feed',
    );

    const next: Conversation = {
      ...page(['200']),
      receiveCursor: '200',
      hasOlder: false,
    };

    client.setQueryData(nextKey, next);
    client.setQueryData(otherKey, next);
    gate.resolve(page(['100']));
    await rejected;
    expect(client.getQueryData(key)).toBeUndefined();
    expect(client.getQueryData(nextKey)).toEqual(next);
    expect(client.getQueryData(otherKey)).toEqual(next);
  });

  it('clears prior data when an incremental request loses access', async () => {
    vi.mocked(getFeed).mockResolvedValueOnce(page(['100']));
    await read();
    vi.mocked(getFeed).mockRejectedValueOnce(new ApiError(403, 'forbidden'));
    await read();
    expect(getFeed).toHaveBeenCalledTimes(2);
    expect(getFeed).toHaveBeenLastCalledWith(
      'meeting',
      { after: '100' },
      expect.any(AbortSignal),
    );
    expect(client.getQueryData(key)).toBeUndefined();
    expect(accessEpoch('user', 'meeting')).toBeGreaterThan(epoch);
    await expect(loadConversation(client, 'user', 'meeting', epoch)).rejects.toThrow();
    expect(getFeed).toHaveBeenCalledTimes(2);
  });

  it('does not revive history after access changes during before', async () => {
    vi.mocked(getFeed).mockResolvedValueOnce(page(['100']));
    await read();
    const gate = deferredPage();
    vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
    const pending = loadOlderConversation(client, 'user', 'meeting', epoch);
    const rejected = expect(pending).rejects.toThrow('Stale access');
    denyAccess(client, 'user', 'meeting', epoch);
    gate.resolve(page(['90']));
    await rejected;
    expect(client.getQueryData(key)).toBeUndefined();
  });
});
