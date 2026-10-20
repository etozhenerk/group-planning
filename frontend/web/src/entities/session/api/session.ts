import { ApiError, logoutRequest, request, sessionSchema } from '@/shared/api';
import type { Session } from '@/entities/session/model/types';

export const getSession = async (signal?: AbortSignal): Promise<Session | null> => {
  try {
    const wire = await request(
      sessionSchema,
      '/me',
      { ...(signal ? { signal } : {}) },
      true,
    );

    return {
      user: { id: wire.user.id, displayName: wire.user.display_name },
      expiresAt: wire.expires_at,
      csrf: wire.csrf_token,
    };
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }

    throw error;
  }
};

export const endSession = async (csrf: string | null): Promise<void> => {
  await logoutRequest(csrf);
};
