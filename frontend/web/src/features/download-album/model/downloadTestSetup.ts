import { vi } from 'vitest';
import type { AlbumExport } from '@/features/download-album/api/albumExportSchema';
import type {
  AlbumDownloadScope,
  AlbumExportAPI,
} from '@/features/download-album/model/types';
import { createAlbumDownload } from '@/features/download-album/model/createAlbumDownload';

export const meeting = '97ac7506-97ab-4192-a6e7-093f4b06ef4f';

export const status = (
  state: AlbumExport['state'] = 'preparing',
  id = 'archive-1',
): AlbumExport => ({
  id,
  state,
  count: 103,
  expires_at: new Date(Date.now() + 60_000).toISOString(),
});

export const deferred = <T>() => {
  const value = {} as { resolve: (result: T) => void; reject: (error: unknown) => void };
  const promise = new Promise<T>((resolve, reject) => {
    value.resolve = resolve;
    value.reject = reject;
  });

  return { promise, ...value };
};

export const setup = () => {
  const lease = new AbortController();
  const access = { valid: true };
  const scope: AlbumDownloadScope = {
    user: 'user-alice',
    meeting,
    csrf: 'test-csrf',
    signal: lease.signal,
    current: () => access.valid,
  };

  const api: AlbumExportAPI = {
    prepare: vi.fn().mockResolvedValue(status()),
    status: vi.fn().mockResolvedValue(status('ready')),
    cancel: vi.fn().mockResolvedValue(undefined),
  };

  const navigate = vi.fn();
  const denied = vi.fn();
  const controller = createAlbumDownload(scope, { api, navigate, denied });

  return { controller, api, navigate, denied, lease, access };
};
