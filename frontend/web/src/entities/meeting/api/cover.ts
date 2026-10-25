import { ApiError, reportUnauthorized } from '@/shared/api';

export const readCover = async (url: string, signal: AbortSignal) => {
  const response = await fetch(url, {
    credentials: 'same-origin',
    cache: 'no-store',
    redirect: 'error',
    signal,
  });

  if (response.status === 401) {
    reportUnauthorized();
  }

  if (!response.ok) {
    throw new ApiError(response.status, 'cover_unavailable');
  }

  if (!['image/jpeg', 'image/png'].includes(response.headers.get('Content-Type') ?? '')) {
    throw new ApiError(502, 'invalid_response');
  }

  const blob = await response.blob();

  if (blob.size > 5 * 1024 * 1024) {
    throw new ApiError(502, 'invalid_response');
  }

  return blob;
};
