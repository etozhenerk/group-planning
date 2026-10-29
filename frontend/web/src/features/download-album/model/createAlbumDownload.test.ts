import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { ApiError } from '@/shared/api';
import { publishPrivateStore } from '@/shared/lib/private-store';
import {
  deferred,
  meeting,
  setup,
  status,
} from '@/features/download-album/model/downloadTestSetup';
import type { AlbumExport } from '@/features/download-album/api/albumExportSchema';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  publishPrivateStore({ kind: 'purged' });
  vi.useRealTimers();
});

it('prepares one snapshot and hands a ready archive to the browser once without claiming disk success', async () => {
  const f = setup();
  const first = f.controller.start();
  expect(f.controller.start()).toBe(first);
  expect(f.controller.getSnapshot()).toEqual({ phase: 'preparing', count: null });
  await vi.advanceTimersByTimeAsync(1_000);
  await first;
  expect(f.api.prepare).toHaveBeenCalledTimes(1);
  expect(f.api.status).toHaveBeenCalledTimes(1);
  expect(f.navigate).toHaveBeenCalledExactlyOnceWith(meeting, 'archive-1');
  expect(f.controller.getSnapshot()).toEqual({ phase: 'started', count: 103 });
});

it('cancels a delayed POST and deletes its late acknowledgement without resurrecting the operation', async () => {
  const f = setup();
  const late = deferred<AlbumExport>();
  vi.mocked(f.api.prepare).mockReturnValueOnce(late.promise);
  const running = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  const signal = vi.mocked(f.api.prepare).mock.calls[0]?.[3];
  f.controller.cancel();
  expect(signal?.aborted).toBe(true);
  late.resolve(status('ready'));
  await running;
  expect(f.navigate).not.toHaveBeenCalled();
  expect(f.api.cancel).toHaveBeenCalledWith(meeting, 'archive-1', 'test-csrf');
  expect(f.controller.getSnapshot()).toEqual({ phase: 'idle' });
});

it('leaves a handed-off browser download running on navigation and a new preparation', async () => {
  const f = setup();
  vi.mocked(f.api.prepare).mockResolvedValue(status('ready'));
  await f.controller.start();
  vi.mocked(f.api.prepare).mockResolvedValue(status('ready', 'archive-2'));
  await f.controller.start();
  f.lease.abort();
  expect(f.navigate).toHaveBeenCalledTimes(2);
  expect(f.api.cancel).not.toHaveBeenCalled();
});

it('old ready and terminal responses cannot replace a restarted operation or invalidate its account', async () => {
  const f = setup();
  const late = deferred<AlbumExport>();
  vi.mocked(f.api.status).mockReturnValueOnce(late.promise);
  const old = f.controller.start();
  await vi.advanceTimersByTimeAsync(1_000);
  f.controller.cancel();
  vi.mocked(f.api.prepare).mockResolvedValueOnce(status('ready', 'archive-2'));
  await f.controller.start();
  late.reject(new ApiError(401, 'unauthorized'));
  await old;
  expect(f.denied).not.toHaveBeenCalled();
  expect(f.navigate).toHaveBeenCalledExactlyOnceWith(meeting, 'archive-2');
  expect(f.controller.getSnapshot().phase).toBe('started');
});

it('unmount aborts preparation, removes the known export and cancels all future polls', async () => {
  const f = setup();
  const running = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  f.lease.abort();
  await running;
  await vi.advanceTimersByTimeAsync(10_000);
  await f.controller.start();
  expect(f.api.status).not.toHaveBeenCalled();
  expect(f.api.prepare).toHaveBeenCalledTimes(1);
  expect(f.api.cancel).toHaveBeenCalledTimes(1);
  expect(f.navigate).not.toHaveBeenCalled();
});

it('ignores another meeting purge but permanently stops on this account logout or access revocation', async () => {
  const f = setup();
  const running = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  publishPrivateStore({ kind: 'purged', user: 'someone-else' });
  publishPrivateStore({ kind: 'purged', user: 'user-alice', meeting: 'another' });
  expect(f.controller.getSnapshot().phase).toBe('preparing');
  publishPrivateStore({ kind: 'purged', user: 'user-alice', meeting });
  await running;
  await f.controller.start();
  expect(f.api.prepare).toHaveBeenCalledTimes(1);
  expect(f.api.cancel).toHaveBeenCalledTimes(1);
  expect(f.navigate).not.toHaveBeenCalled();
});

it('rechecks the immutable access lease after ready and never navigates a stale response', async () => {
  const f = setup();
  const late = deferred<AlbumExport>();
  vi.mocked(f.api.status).mockReturnValue(late.promise);
  const running = f.controller.start();
  await vi.advanceTimersByTimeAsync(1_000);
  f.access.valid = false;
  late.resolve(status('ready'));
  await running;
  expect(f.navigate).not.toHaveBeenCalled();
  expect(f.api.cancel).toHaveBeenCalledExactlyOnceWith(meeting, 'archive-1', 'test-csrf');
});

it('never navigates an expired or switched export and cleans up only its own id', async () => {
  const f = setup();
  vi.mocked(f.api.status).mockResolvedValue(status('ready', 'someone-elses-archive'));
  const running = f.controller.start();
  await vi.advanceTimersByTimeAsync(1_000);
  await running;
  expect(f.controller.getSnapshot().phase).toBe('error');
  expect(f.api.cancel).toHaveBeenCalledExactlyOnceWith(meeting, 'archive-1', 'test-csrf');
  expect(f.navigate).not.toHaveBeenCalled();
  vi.mocked(f.api.prepare).mockResolvedValue({
    ...status('ready', 'archive-2'),
    expires_at: new Date(Date.now() - 1).toISOString(),
  });
  await f.controller.start();
  expect(f.controller.getSnapshot().phase).toBe('error');
  expect(f.navigate).not.toHaveBeenCalled();
});

it('cleans up a failed archive before retry and uses a new idempotency key', async () => {
  const f = setup();
  vi.mocked(f.api.status).mockResolvedValue(status('failed'));
  const failed = f.controller.start();
  await vi.advanceTimersByTimeAsync(1_000);
  await failed;
  expect(f.controller.getSnapshot().phase).toBe('error');
  vi.mocked(f.api.prepare).mockResolvedValue(status('ready', 'archive-2'));
  await f.controller.start();
  expect(f.navigate).toHaveBeenCalledExactlyOnceWith(meeting, 'archive-2');
  const keys = vi.mocked(f.api.prepare).mock.calls.map((call) => call[2]);
  expect(keys[0]).not.toBe(keys[1]);
  expect(f.api.cancel).toHaveBeenCalledTimes(1);
});

it('retries an ambiguous lost POST using the same key instead of orphaning a second archive', async () => {
  const f = setup();
  vi.mocked(f.api.prepare).mockRejectedValueOnce(new TypeError('network'));
  await f.controller.start();
  vi.mocked(f.api.prepare).mockResolvedValueOnce(status('ready'));
  await f.controller.start();
  const keys = vi.mocked(f.api.prepare).mock.calls.map((call) => call[2]);
  expect(keys[0]).toBe(keys[1]);
  expect(f.navigate).toHaveBeenCalledOnce();
});

it.each([401, 403])(
  'terminates a current %s operation without SDK-style retry loops',
  async (code) => {
    const f = setup();
    vi.mocked(f.api.prepare).mockRejectedValue(new ApiError(code, 'denied'));
    await f.controller.start();
    await f.controller.start();
    await vi.advanceTimersByTimeAsync(10_000);
    expect(f.api.prepare).toHaveBeenCalledTimes(1);
    expect(f.denied).toHaveBeenCalledOnce();
    expect(f.navigate).not.toHaveBeenCalled();
  },
);
