import { QueryClient } from '@tanstack/react-query';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { readMedia } from '@/entities/meeting/api/media';
import { mediaImageOptions } from '@/entities/meeting/model/mediaImageOptions';
import {
  clearMeeting,
  resetAccess,
  denyAccess,
  accessEpoch,
} from '@/entities/meeting/model/access';

vi.mock('@/entities/meeting/api/media', () => ({ readMedia: vi.fn() }));
const clients: QueryClient[] = [];
const revoke = vi.fn();
const client = () => {
  const result = new QueryClient();
  clients.push(result);

  return result;
};

beforeEach(() => {
  resetAccess();
  vi.mocked(readMedia)
    .mockReset()
    .mockResolvedValue(new Blob(['test'], { type: 'image/png' }));
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      decode = () => Promise.resolve();
    },
  );
  revoke.mockClear();
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(revoke);
});
afterEach(() => {
  clients.splice(0).forEach((value) => value.clear());
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it('reuses a decoded URL through remount and invalidation then revokes it on access cleanup', async () => {
  const cache = client();
  const options = mediaImageOptions(
    cache,
    'alice',
    'meeting',
    accessEpoch('alice', 'meeting'),
    'photo',
  );

  const first = await cache.fetchQuery(options);
  await cache.invalidateQueries({ queryKey: options.queryKey });
  expect(await cache.fetchQuery(options)).toBe(first);
  expect(readMedia).toHaveBeenCalledTimes(1);
  clearMeeting(cache, 'alice', 'meeting');
  expect(revoke).toHaveBeenCalledWith(first.url);
  expect(cache.getQueryData(options.queryKey)).toBeUndefined();
});

it('does not share private images between accounts and removes both on logout', async () => {
  const cache = client();
  const first = await cache.fetchQuery(
    mediaImageOptions(
      cache,
      'alice',
      'meeting',
      accessEpoch('alice', 'meeting'),
      'photo',
    ),
  );

  const second = await cache.fetchQuery(
    mediaImageOptions(cache, 'bob', 'meeting', accessEpoch('bob', 'meeting'), 'photo'),
  );

  expect(first.url).not.toBe(second.url);
  expect(readMedia).toHaveBeenCalledTimes(2);
  cache.clear();
  expect(revoke).toHaveBeenCalledWith(first.url);
  expect(revoke).toHaveBeenCalledWith(second.url);
});

it('does not rehydrate a revoked meeting when a delayed decode resolves', async () => {
  const cache = client();
  let finish: (() => void) | undefined;
  vi.stubGlobal(
    'Image',
    class {
      src = '';
      decode = () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        });
    },
  );
  const epoch = accessEpoch('alice', 'meeting');
  const options = mediaImageOptions(cache, 'alice', 'meeting', epoch, 'photo');
  const pending = cache.fetchQuery(options).catch(() => undefined);
  await vi.waitFor(() => expect(finish).toBeTypeOf('function'));
  denyAccess(cache, 'alice', 'meeting', epoch, false);
  finish?.();
  await pending;
  await vi.waitFor(() => expect(revoke).toHaveBeenCalled());
  expect(cache.getQueryData(options.queryKey)).toBeUndefined();
});
