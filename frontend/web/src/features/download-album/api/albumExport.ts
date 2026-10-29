import { ApiError, parseApiError, request, uuid, writeOptions } from '@/shared/api';
import {
  albumExportIdSchema,
  albumExportSchema,
} from '@/features/download-album/api/albumExportSchema';

export const albumExportPath = (meeting: string, id?: string) => {
  const meetingId = uuid.parse(meeting);
  const base = `/meetings/${meetingId}/memories/exports`;

  if (id === undefined) {
    return base;
  }

  const exportId = albumExportIdSchema.parse(id);

  if (exportId === '.' || exportId === '..') {
    throw new ApiError(502, 'invalid_response');
  }

  return `${base}/${encodeURIComponent(exportId)}`;
};

export const prepareAlbumExport = (
  meeting: string,
  csrf: string | null,
  key: string,
  signal: AbortSignal,
) =>
  request(
    albumExportSchema,
    albumExportPath(meeting),
    { ...writeOptions('POST', csrf, {}, key), signal, redirect: 'error' },
    true,
  );

export const getAlbumExport = (meeting: string, id: string, signal: AbortSignal) =>
  request(
    albumExportSchema,
    albumExportPath(meeting, id),
    { signal, redirect: 'error' },
    true,
  );

export const cancelAlbumExport = async (
  meeting: string,
  id: string,
  csrf: string | null,
): Promise<void> => {
  const response = await fetch(`/api/v1${albumExportPath(meeting, id)}`, {
    ...writeOptions('DELETE', csrf),
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    keepalive: true,
    signal: AbortSignal.timeout(10_000),
  });

  // A consumed, expired or already canceled export has nothing left to delete.
  if (response.status === 204 || response.status === 404) {
    return;
  }

  const body: unknown = await response.json().catch(() => null);
  throw parseApiError(response.status, body);
};
