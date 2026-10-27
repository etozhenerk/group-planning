import { getFeed } from '@/entities/meeting/api/read';
import { ApiError } from '@/shared/api';
import { getChatSnapshot } from '@/entities/meeting/api/chat';

export const readChatSnapshot = async (
  id: string,
  signal?: AbortSignal,
  anchor?: string,
  tail = false,
) => {
  if (tail) {
    const page = await getFeed(id, {}, signal);
    signal?.throwIfAborted();
    anchor = page.entries.at(-1)?.id;
  }

  try {
    return await getChatSnapshot(id, signal, anchor);
  } catch (error) {
    if (anchor && error instanceof ApiError && error.status === 404) {
      signal?.throwIfAborted();

      return getChatSnapshot(id, signal);
    }

    throw error;
  }
};
