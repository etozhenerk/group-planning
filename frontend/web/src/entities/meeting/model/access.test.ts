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

beforeEach(resetAccess);
describe('private cache access generation', () => {
  it('rejects a late success after access has been revoked', async () => {
    const client = new QueryClient();
    const deferred: { resolve?: (value: string) => void } = {};
    const operation = guarded(
      client,
      'user',
      'meeting',
      0,
      () =>
        new Promise<string>((resolve) => {
          deferred.resolve = resolve;
        }),
    );

    denyAccess(client, 'user', 'meeting', 0);
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

    denyAccess(client, 'user', 'meeting', 0);
    expect(applyResponse(client, 'user', response, 0)).toBe(false);
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
    client.setQueryData(['private', 'user', 'meeting', 0, 'feed'], ['text']);
    client.setQueryData(['private', 'user', 'other', 0, 'feed'], ['other']);
    denyAccess(client, 'user', 'meeting', 0);
    expect(
      client.getQueryData(['private', 'user', 'meeting', 0, 'feed']),
    ).toBeUndefined();
    expect(client.getQueryData(['private', 'user', 'other', 0, 'feed'])).toEqual([
      'other',
    ]);
  });
});
