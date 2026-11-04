import { ApiError, request } from '@/shared/api';
import {
  chatCapabilitiesSchema,
  chatChangesSchema,
  chatSnapshotSchema,
} from '@/entities/meeting/model/chatSchema';

export const getChatCapabilities = async (signal?: AbortSignal) => {
  try {
    return await request(chatCapabilitiesSchema, '/chat-capabilities', {
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return {
        protocol_version: 1 as const,
        sync: false,
        realtime: false,
        read_state: false,
      };
    }

    throw error;
  }
};

export const getChatSnapshot = (id: string, signal?: AbortSignal, anchor?: string) => {
  const params = new URLSearchParams({ limit: '50' });

  if (anchor) {
    params.set('around_entry_id', anchor);
  }

  return request(chatSnapshotSchema, `/meetings/${id}/sync?${params}`, {
    ...(signal ? { signal } : {}),
  });
};

export const getChatChanges = (id: string, cursor: string, signal?: AbortSignal) =>
  request(
    chatChangesSchema,
    `/meetings/${id}/sync?${new URLSearchParams({ cursor, limit: '100' })}`,
    { ...(signal ? { signal } : {}) },
  );
