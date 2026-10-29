import { afterEach, expect, it, vi } from 'vitest';
import { ApiError, onUnauthorized } from '@/shared/api';
import {
  albumExportPath,
  cancelAlbumExport,
  getAlbumExport,
  prepareAlbumExport,
} from '@/features/download-album/api/albumExport';

const meeting = '97ac7506-97ab-4192-a6e7-093f4b06ef4f';
const valid = {
  id: 'export-1',
  state: 'preparing',
  count: 103,
  expires_at: '2026-10-29T23:00:00Z',
};

afterEach(() => vi.unstubAllGlobals());

it('uses the contracted prepare endpoint, CSRF, idempotency and same-origin credentials', async () => {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValue(Response.json(valid, { status: 202 }));

  vi.stubGlobal('fetch', fetcher);
  const signal = new AbortController().signal;
  await expect(
    prepareAlbumExport(meeting, 'csrf', 'request-key', signal),
  ).resolves.toEqual(valid);
  expect(fetcher).toHaveBeenCalledExactlyOnceWith(
    `/api/v1/meetings/${meeting}/memories/exports`,
    {
      method: 'POST',
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'error',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf',
        'Idempotency-Key': 'request-key',
      },
      body: '{}',
    },
  );
});

it.each([
  { ...valid, state: 'completed' },
  { ...valid, count: 0 },
  { ...valid, count: 1.5 },
  { ...valid, expires_at: 'tomorrow' },
  { ...valid, id: '' },
  { ...valid, id: 'x'.repeat(129) },
  { ...valid, download_url: 'https://other.example/private' },
])('rejects external response outside the closed AlbumExport DTO', async (body) => {
  vi.stubGlobal('fetch', vi.fn<typeof fetch>().mockResolvedValue(Response.json(body)));
  await expect(
    getAlbumExport(meeting, 'export-1', new AbortController().signal),
  ).rejects.toMatchObject({ status: 502, code: 'invalid_response' });
});

it('encodes opaque export identifiers and prevents dot-segment route traversal', () => {
  expect(albumExportPath(meeting, '../other?token=x#fragment')).toBe(
    `/meetings/${meeting}/memories/exports/..%2Fother%3Ftoken%3Dx%23fragment`,
  );
  expect(() => albumExportPath(meeting, '..')).toThrow(ApiError);
  expect(() => albumExportPath('//external.example', 'export-1')).toThrow();
});

it('cancel treats absent exports as cleared but preserves other errors without invalidating a new session', async () => {
  const unauthorized = vi.fn();
  const remove = onUnauthorized(unauthorized);
  const fetcher = vi
    .fn<typeof fetch>()
    .mockResolvedValueOnce(new Response(null, { status: 204 }))
    .mockResolvedValueOnce(new Response(null, { status: 404 }))
    .mockResolvedValueOnce(
      Response.json(
        { error: { code: 'unauthorized', field_errors: {}, request_id: 'test' } },
        { status: 401 },
      ),
    );

  vi.stubGlobal('fetch', fetcher);

  try {
    await expect(
      cancelAlbumExport(meeting, 'export-1', 'old-csrf'),
    ).resolves.toBeUndefined();
    await expect(
      cancelAlbumExport(meeting, 'export-1', 'old-csrf'),
    ).resolves.toBeUndefined();
    await expect(
      cancelAlbumExport(meeting, 'export-1', 'old-csrf'),
    ).rejects.toMatchObject({ status: 401 });
    expect(unauthorized).not.toHaveBeenCalled();
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      method: 'DELETE',
      credentials: 'same-origin',
      cache: 'no-store',
      keepalive: true,
      redirect: 'error',
    });
  } finally {
    remove();
  }
});
