import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getFeed } from '@/entities/meeting/api/read';
import { privateKey, guarded } from '@/entities/meeting/model/access';
import { feedWindow } from '@/entities/meeting/model/feedWindow';
import { loadWindowPage } from '@/entities/meeting/model/loadWindowPage';
import { readChatSnapshot } from '@/entities/meeting/model/readChatSnapshot';
import { snapshotConversation } from '@/entities/meeting/model/chatState';
import { applyChatProjections } from '@/entities/meeting/model/applyChatProjections';
import type { Conversation } from '@/entities/meeting/model/types';

export const useWindowHistory = (user: string, id: string, epoch: number) => {
  const client = useQueryClient();
  const requests = useRef(new Map<string, AbortController>());
  const [loading, setLoading] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, unknown>>({});
  useEffect(() => {
    const active = requests.current;

    return () => {
      for (const request of active.values()) {
        request.abort();
      }

      active.clear();
    };
  }, [user, id, epoch]);
  const load = async (direction: 'older' | 'newer' | 'latest') => {
    if (requests.current.has(direction)) {
      return false;
    }

    const controller = new AbortController();
    requests.current.set(direction, controller);
    setLoading([...requests.current.keys()]);
    setErrors((previous) => ({ ...previous, [direction]: null }));

    try {
      if (direction !== 'latest') {
        return await loadWindowPage(
          client,
          user,
          id,
          epoch,
          direction,
          controller.signal,
        );
      }

      for (const [key, request] of requests.current) {
        if (key !== 'latest') {
          request.abort();
        }
      }

      const key = privateKey(user, id, epoch, 'feed');
      await client.cancelQueries({ queryKey: key, exact: true });
      await guarded(client, user, id, epoch, async () => {
        if (client.getQueryData<Conversation>(key)?.sync) {
          const page = await guarded(client, user, id, epoch, () =>
            readChatSnapshot(
              id,
              controller.signal,
              undefined,
              !!client.getQueryData<Conversation>(key)?.read,
            ),
          );

          controller.signal.throwIfAborted();
          applyChatProjections(client, user, id, epoch, page.projections);
          client.setQueryData(key, snapshotConversation(page));
        } else {
          const page = await guarded(client, user, id, epoch, () =>
            getFeed(id, {}, controller.signal),
          );

          controller.signal.throwIfAborted();
          client.setQueryData<Conversation>(key, {
            ...page,
            window: feedWindow(page.entries),
            hasOlder: page.hasMore,
            receiveCursor: page.entries.at(-1)?.sequence ?? '0',
          });
        }
      });

      void client.invalidateQueries({
        queryKey: key,
        exact: true,
        refetchType: 'active',
      });

      return true;
    } catch (error) {
      if (
        !controller.signal.aborted &&
        !(error instanceof DOMException && error.name === 'AbortError')
      ) {
        setErrors((previous) => ({ ...previous, [direction]: error }));
      }

      return false;
    } finally {
      if (requests.current.get(direction) === controller) {
        requests.current.delete(direction);
      }

      if (!controller.signal.aborted) {
        setLoading([...requests.current.keys()]);
      }
    }
  };

  return {
    loadOlder: () => load('older'),
    loadNewer: () => load('newer'),
    loadLatest: () => load('latest'),
    loadingOlder: loading.includes('older'),
    loadingNewer: loading.includes('newer'),
    historyError: errors.older,
    newerError: errors.newer ?? errors.latest,
  };
};
