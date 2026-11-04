import { z } from 'zod';
import {
  ApiError,
  mediaLimitsSchema,
  mediaResultSchema,
  mediaSchema,
  memoriesSchema,
  request,
  writeOptions,
  parseApiError,
  reportUnauthorized,
  entrySchema,
} from '@/shared/api';

export const getMediaLimits = (id: string, signal?: AbortSignal) =>
  request(mediaLimitsSchema, `/meetings/${id}/media/limits`, signal ? { signal } : {});

export const reserveMedia = (
  id: string,
  file: File,
  purpose: 'message' | 'memory',
  key: string,
  csrf: string | null,
  signal: AbortSignal,
) =>
  request(mediaResultSchema, `/meetings/${id}/media/uploads`, {
    ...writeOptions(
      'POST',
      csrf,
      {
        client_request_id: key,
        file_name: file.name,
        content_type: file.type,
        size_bytes: file.size,
        purpose,
      },
      key,
    ),
    signal,
  });

export const publishMedia = (
  id: string,
  media: string,
  key: string,
  csrf: string | null,
  signal: AbortSignal,
  caption = '',
) =>
  request(
    z.object({ media: mediaSchema, entry: entrySchema.nullable() }),
    `/meetings/${id}/media/${media}/publish`,
    { ...writeOptions('POST', csrf, caption ? { caption } : {}, key), signal },
  );

export const getMemories = (id: string, cursor: string | null, signal: AbortSignal) =>
  request(
    memoriesSchema,
    `/meetings/${id}/memories?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    { signal },
  );

export const uploadMedia = (
  id: string,
  media: string,
  file: File,
  csrf: string | null,
  signal: AbortSignal,
  progress: (value: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const abort = () => xhr.abort();
    xhr.open('PUT', `/api/v1/meetings/${id}/media/${media}/content`);
    xhr.setRequestHeader('Content-Type', file.type);

    if (csrf) {
      xhr.setRequestHeader('X-CSRF-Token', csrf);
    }

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        progress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();

        return;
      }

      if (xhr.status === 401) {
        reportUnauthorized();
      }

      try {
        reject(parseApiError(xhr.status, JSON.parse(xhr.responseText)));
      } catch {
        reject(new ApiError(xhr.status, 'upload_failed'));
      }
    };

    xhr.onerror = () => reject(new Error('Загрузка прервалась.'));
    xhr.onabort = () => reject(new DOMException('Cancelled', 'AbortError'));
    xhr.onloadend = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });

    if (signal.aborted) {
      reject(new DOMException('Cancelled', 'AbortError'));

      return;
    }

    xhr.send(file);
  });

export const readMedia = async (id: string, media: string, signal: AbortSignal) => {
  const response = await fetch(`/api/v1/meetings/${id}/media/${media}/content`, {
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    signal,
  });

  if (response.status === 401) {
    reportUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'media_unavailable');
  }

  return response.blob();
};
