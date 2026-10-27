import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  accessEpoch,
  applyResponse,
  denyAccess,
  guarded,
  resetAccess,
} from '@/entities/meeting/model/access';
import type { ResponseState } from '@/entities/meeting/model/types';

let epoch = accessEpoch('user', 'meeting');
beforeEach(() => {
  resetAccess();
  epoch = accessEpoch('user', 'meeting');
});
describe('private cache access generation', () => {
  it('rejects a late success after access has been revoked', async () => {
    const client = new QueryClient();
    const deferred: { resolve?: (value: string) => void } = {};
    const operation = guarded(
      client,
      'user',
      'meeting',
      epoch,
      () =>
        new Promise<string>((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    denyAccess(client, 'user', 'meeting', epoch);
    deferred.resolve?.('private text');
    await expect(operation).rejects.toMatchObject({ name: 'AbortError' });
  });
  it('does not let an old successful going response reopen the conversation', () => {
    const client = new QueryClient();
    const response: ResponseState = {
      meetingId: 'meeting',
      answer: 'going',
      revision: '1',
      meetingRevision: '2',
      canAccess: true,
    };

    denyAccess(client, 'user', 'meeting', epoch);
    expect(applyResponse(client, 'user', response, epoch)).toBe(false);
    expect(applyResponse(client, 'user', response, accessEpoch('user', 'meeting'))).toBe(
      true,
    );
    expect(
      applyResponse(
        client,
        'user',
        { ...response, answer: 'maybe', revision: '0', canAccess: false },
        accessEpoch('user', 'meeting'),
      ),
    ).toBe(false);
  });
  it('clears only private data of the revoked meeting', () => {
    const client = new QueryClient();
    client.setQueryData(['private', 'user', 'meeting', epoch, 'feed'], ['text']);
    client.setQueryData(['private', 'user', 'other', epoch, 'feed'], ['other']);
    denyAccess(client, 'user', 'meeting', epoch);
    expect(
      client.getQueryData(['private', 'user', 'meeting', epoch, 'feed']),
    ).toBeUndefined();
    expect(client.getQueryData(['private', 'user', 'other', epoch, 'feed'])).toEqual([
      'other',
    ]);
  });
});
