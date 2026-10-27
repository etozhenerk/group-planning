import type { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { getChatCapabilities, getChatChanges } from '@/entities/meeting/api/chat';
import { guarded, privateKey } from '@/entities/meeting/model/access';
import {
  applyChatChanges,
  snapshotConversation,
} from '@/entities/meeting/model/chatState';
import { applyChatProjections } from '@/entities/meeting/model/applyChatProjections';
import { getFeed } from '@/entities/meeting/api/read';
import { loadConversation } from '@/entities/meeting/model/loadConversation';
import { readChatSnapshot } from '@/entities/meeting/model/readChatSnapshot';
import type { ChatChanges } from '@/entities/meeting/model/chatSchema';
import type { FeedPosition } from '@/entities/meeting/model/feedWindow';
import type { Conversation } from '@/entities/meeting/model/types';

export const loadChat = async (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  signal?: AbortSignal,
  recovery = 0,
): Promise<Conversation> => {
  const legacy = () =>
    guarded(client, user, id, epoch, async () => {
      if (client.getQueryData<Conversation>(privateKey(user, id, epoch, 'feed'))?.sync) {
        const page = await getFeed(id, {}, signal);

        return {
          ...page,
          hasOlder: page.hasMore,
          receiveCursor: page.entries.at(-1)?.sequence ?? '0',
        };
      }

      return loadConversation(client, user, id, epoch, signal);
    });

  const capabilities = await client.fetchQuery({
    queryKey: ['chat-capabilities', user, epoch],
    staleTime: 30_000,
    queryFn: () => getChatCapabilities(signal),
  });

  if (!capabilities.sync) {
    return legacy();
  }

  return guarded(client, user, id, epoch, async () => {
    const key = privateKey(user, id, epoch, 'feed');
    const snapshot = async (newMessages?: number) => {
      const position = client.getQueryData<FeedPosition>(
        privateKey(user, id, epoch, 'feed-position'),
      );

      const page = await guarded(client, user, id, epoch, () =>
        readChatSnapshot(
          id,
          signal,
          position?.following ? undefined : (position?.entryId ?? undefined),
          !!position?.following && capabilities.read_state,
        ),
      );

      signal?.throwIfAborted();

      if (
        capabilities.read_state &&
        (!position ||
          (position.entryId &&
            !page.entries.some((entry) => entry.id === position.entryId)))
      ) {
        client.setQueryData<FeedPosition>(privateKey(user, id, epoch, 'feed-position'), {
          entryId: page.first_unread ?? null,
          offset: 0,
          following: !page.first_unread,
          focusedId: null,
        });
      }

      const previous = client.getQueryData<Conversation>(key);
      const result = {
        ...snapshotConversation(page),
        newMessages: newMessages ?? previous?.newMessages ?? 0,
      };

      applyChatProjections(client, user, id, epoch, page.projections);
      client.setQueryData(key, result);

      return result;
    };

    if (!client.getQueryData<Conversation>(key)?.sync) {
      return snapshot();
    }

    const recover = async (page?: ChatChanges) => {
      if (recovery >= 1) {
        throw new Error('Repeated sync reset');
      }

      const previous = client.getQueryData<Conversation>(key);
      const messages =
        page && previous?.sync?.streamEpoch === page.stream_epoch
          ? applyChatChanges(previous, page, user).newMessages
          : previous?.newMessages;

      await snapshot(messages);

      return loadChat(client, user, id, epoch, signal, recovery + 1);
    };

    const window = client.getQueryData<Conversation>(key)?.window?.id;
    let barrier: string | undefined;
    let cursor = client.getQueryData<Conversation>(key)!.sync!.cursor;

    try {
      while (true) {
        const page = await guarded(client, user, id, epoch, () =>
          getChatChanges(id, cursor, signal),
        );

        signal?.throwIfAborted();

        if (client.getQueryData<Conversation>(key)?.window?.id !== window) {
          throw new DOMException('Stale feed window', 'AbortError');
        }

        if (
          page.changes.some((change) => change.kind === 'history_invalidated') ||
          page.stream_epoch !== client.getQueryData<Conversation>(key)?.sync?.streamEpoch
        ) {
          return recover(page);
        }

        if (
          (barrier && barrier !== page.through_cursor) ||
          (page.has_more && cursor === page.next_cursor)
        ) {
          throw new Error('Invalid sync boundary');
        }

        barrier = page.through_cursor;
        const latest = client.getQueryData<Conversation>(key);

        if (!latest) {
          throw new DOMException('Stale chat', 'AbortError');
        }

        const result = applyChatChanges(latest, page, user);
        applyChatProjections(client, user, id, epoch, result.sync!.projections);
        client.setQueryData(key, result);
        void client.invalidateQueries({
          queryKey: privateKey(user, id, epoch, 'details'),
          refetchType: 'active',
        });
        cursor = page.next_cursor;

        if (!page.has_more) {
          return result;
        }
      }
    } catch (error) {
      if (error instanceof ApiError && error.status === 404) {
        const flags = await getChatCapabilities(signal);

        if (!flags.sync) {
          client.setQueryData(['chat-capabilities', user, epoch], flags);

          return legacy();
        }
      }

      if (
        error instanceof ApiError &&
        error.status === 410 &&
        error.code === 'sync_reset_required'
      ) {
        return recover();
      }

      throw error;
    }
  });
};
