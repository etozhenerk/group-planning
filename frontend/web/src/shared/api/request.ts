import type { z } from 'zod';
import { ApiError, parseApiError } from '@/shared/api/errors';

const authEvents = new EventTarget();

export const reportUnauthorized = () =>
  authEvents.dispatchEvent(new Event('unauthorized'));

export const onUnauthorized = (callback: () => void): (() => void) => {
  authEvents.addEventListener('unauthorized', callback);

  return () => authEvents.removeEventListener('unauthorized', callback);
};

export const request = async <T>(
  schema: z.ZodType<T>,
  path: string,
  init: RequestInit = {},
  optionalSession = false,
): Promise<T> => {
  const response = await fetch(`/api/v1${path}`, {
    credentials: 'same-origin',
    cache: 'no-store',
    ...init,
  });

  const body: unknown = await response.json();

  if (!response.ok) {
    if (response.status === 401 && !optionalSession) {
      reportUnauthorized();
    }

    throw parseApiError(response.status, body);
  }

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    throw new ApiError(502, 'invalid_response');
  }

  return parsed.data;
};

export const writeOptions = (
  method: string,
  csrf: string | null,
  body?: unknown,
  key?: string,
): RequestInit => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  if (csrf) {
    headers['X-CSRF-Token'] = csrf;
  }

  if (key) {
    headers['Idempotency-Key'] = key;
  }

  return {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  };
};

export const logoutRequest = async (csrf: string | null): Promise<void> => {
  const response = await fetch('/api/v1/auth/logout', {
    credentials: 'same-origin',
    ...writeOptions('POST', csrf),
  });

  if (!response.ok) {
    const body: unknown = await response.json();
    throw parseApiError(response.status, body);
  }
};
