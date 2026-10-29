import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { onUnauthorized } from '@/shared/api';
import { publishPrivateStore } from '@/shared/lib/private-store';
import { createAlbumDownload } from '@/features/download-album/model/createAlbumDownload';
import {
  deferred,
  meeting,
  status,
} from '@/features/download-album/model/downloadTestSetup';

beforeEach(() => vi.useFakeTimers());

afterEach(() => {
  publishPrivateStore({ kind: 'purged' });
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it('validates preparation and polling over the real API adapter before one browser hand-off', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(status(), { status: 202 }))
    .mockResolvedValueOnce(Response.json(status('ready')))
    .mockResolvedValue(new Response(null, { status: 204 }));

  vi.stubGlobal('fetch', fetcher);
  const link = { href: '', download: '', hidden: false, click: vi.fn(), remove: vi.fn() };
  vi.stubGlobal('document', {
    body: { append: vi.fn() },
    createElement: vi.fn().mockReturnValue(link),
  });
  const denied = vi.fn();
  const controller = createAlbumDownload(
    {
      user: 'alice',
      meeting,
      csrf: 'test-csrf',
      signal: new AbortController().signal,
      current: () => true,
    },
    { denied },
  );

  const running = controller.start();
  await vi.advanceTimersByTimeAsync(1_000);
  await running;
  expect(fetcher.mock.calls.map(([url, init]) => [url, init?.method ?? 'GET'])).toEqual([
    [`/api/v1/meetings/${meeting}/memories/exports`, 'POST'],
    [`/api/v1/meetings/${meeting}/memories/exports/archive-1`, 'GET'],
  ]);
  expect(link.href).toBe(
    `/api/v1/meetings/${meeting}/memories/exports/archive-1/download`,
  );
  expect(link.click).toHaveBeenCalledOnce();
  expect(controller.getSnapshot()).toEqual({ phase: 'started', count: 103 });
  expect(denied).not.toHaveBeenCalled();
});

it('an old account HTTP 401 cannot notify global authentication or change the next account operation', async () => {
  const late = deferred<Response>();
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(Response.json(status(), { status: 202 }))
    .mockReturnValueOnce(late.promise)
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(Response.json(status('ready', 'archive-2'), { status: 202 }))
    .mockResolvedValue(new Response(null, { status: 204 }));

  vi.stubGlobal('fetch', fetcher);
  const unauthorized = vi.fn();
  const remove = onUnauthorized(unauthorized);
  const denied = vi.fn();
  const navigate = vi.fn();
  const oldLease = new AbortController();
  const oldController = createAlbumDownload(
    {
      user: 'alice',
      meeting,
      csrf: 'old-csrf',
      signal: oldLease.signal,
      current: () => !oldLease.signal.aborted,
    },
    { denied, navigate },
  );

  try {
    const oldRun = oldController.start();
    await vi.advanceTimersByTimeAsync(1_000);
    oldLease.abort();
    const nextController = createAlbumDownload(
      {
        user: 'bob',
        meeting,
        csrf: 'new-csrf',
        signal: new AbortController().signal,
        current: () => true,
      },
      { denied, navigate },
    );

    await nextController.start();
    late.resolve(Response.json({ error: { code: 'unauthorized' } }, { status: 401 }));
    await oldRun;
    expect(unauthorized).not.toHaveBeenCalled();
    expect(denied).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledExactlyOnceWith(meeting, 'archive-2');
    expect(nextController.getSnapshot()).toEqual({ phase: 'started', count: 103 });
    expect(oldController.getSnapshot()).toEqual({ phase: 'idle' });
    expect(fetcher.mock.calls[2]?.[1]).toMatchObject({
      method: 'DELETE',
      headers: { 'X-CSRF-Token': 'old-csrf' },
    });
  } finally {
    remove();
  }
});
