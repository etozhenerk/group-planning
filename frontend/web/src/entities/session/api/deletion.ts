import { ApiError, parseApiError } from '@/shared/api';
import type { PendingDeletion } from '@/entities/session/model/deletion';

export const deleteAccount = async (pending: PendingDeletion): Promise<void> => {
  const headers: Record<string, string> = { 'X-Deletion-Token': pending.token };

  if (pending.csrf) {
    headers['X-CSRF-Token'] = pending.csrf;
  }

  const response = await fetch('/api/v1/me', {
    method: 'DELETE',
    credentials: 'same-origin',
    cache: 'no-store',
    headers,
    signal: AbortSignal.timeout(15_000),
  });

  if (response.status === 204) {
    return;
  }

  if (response.ok) {
    throw new ApiError(502, 'invalid_response');
  }

  const body: unknown = await response.json();
  throw parseApiError(response.status, body);
};
