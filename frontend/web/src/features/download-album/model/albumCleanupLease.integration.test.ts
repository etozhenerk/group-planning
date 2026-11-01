import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import {
  setup,
  deferred,
  status,
  meeting,
} from '@/features/download-album/model/downloadTestSetup';
import type { AlbumExport } from '@/features/download-album/api/albumExportSchema';
import { publishPrivateStore } from '@/shared/lib/private-store';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  publishPrivateStore({ kind: 'purged' });
  vi.useRealTimers();
});
it('cancel a waiting restart then restart again: only the latest owner creates a snapshot after old DELETE settles', async () => {
  const f = setup(),
    ack = deferred<AlbumExport>(),
    deleted = deferred<void>();

  vi.mocked(f.api.prepare)
    .mockReturnValueOnce(ack.promise)
    .mockResolvedValueOnce(status('ready', 'fresh'));
  vi.mocked(f.api.cancel).mockReturnValueOnce(deleted.promise);
  const first = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  f.controller.cancel();
  expect(f.controller.getSnapshot().phase).toBe('idle');
  const abandoned = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  f.controller.cancel();
  const latest = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  expect(f.api.prepare).toHaveBeenCalledTimes(1);
  ack.resolve(status('ready', 'old'));
  await vi.advanceTimersByTimeAsync(0);
  expect(f.api.cancel).toHaveBeenCalledExactlyOnceWith(meeting, 'old', 'test-csrf');
  expect(f.api.prepare).toHaveBeenCalledTimes(1);
  expect(f.navigate).not.toHaveBeenCalled();
  deleted.resolve();
  await Promise.all([first, abandoned, latest]);
  expect(f.api.prepare).toHaveBeenCalledTimes(2);
  expect(f.navigate).toHaveBeenCalledExactlyOnceWith(meeting, 'fresh');
  expect(f.denied).not.toHaveBeenCalled();
});
it('lease lost during same-key recovery: cleanup the old metadata but never create a fresh POST or navigation', async () => {
  const f = setup(),
    ack = deferred<AlbumExport>(),
    recovery = deferred<AlbumExport>();

  vi.mocked(f.api.prepare)
    .mockReturnValueOnce(ack.promise)
    .mockReturnValueOnce(recovery.promise);
  const first = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  f.controller.cancel();
  ack.reject(new TypeError('lost ACK'));
  await first;
  const next = f.controller.start();
  await vi.advanceTimersByTimeAsync(0);
  expect(f.api.prepare).toHaveBeenCalledTimes(2);
  expect(vi.mocked(f.api.prepare).mock.calls[1]?.[2]).toBe(
    vi.mocked(f.api.prepare).mock.calls[0]?.[2],
  );
  f.lease.abort();
  recovery.resolve(status('ready', 'old'));
  await next;
  await vi.advanceTimersByTimeAsync(0);
  expect(f.api.cancel).toHaveBeenCalledExactlyOnceWith(meeting, 'old', 'test-csrf');
  expect(f.api.prepare).toHaveBeenCalledTimes(2);
  expect(f.navigate).not.toHaveBeenCalled();
  expect(f.denied).not.toHaveBeenCalled();
});
