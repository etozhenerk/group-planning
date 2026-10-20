import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { getFeed } from '@/entities/meeting/api/read';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import type { Conversation } from '@/entities/meeting/model/types';

export const useConversation = (id: string, user: string) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const key = privateKey(user, id, access.epoch, 'feed');
  const [historyError, setHistoryError] = useState<unknown>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const query = useQuery<Conversation>({
    queryKey: key,
    enabled: !!user && !access.denied,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (current) =>
      current.state.error
        ? Math.min(30_000, 3_000 * 2 ** Math.min(current.state.errorUpdateCount, 4))
        : 3_000,
    queryFn: ({ signal }): Promise<Conversation> =>
      guarded(client, user, id, access.epoch, async () => {
        const previous = client.getQueryData<Conversation>(key);
        let last = previous?.entries.at(-1)?.sequence;
        let page = await getFeed(id, last ? { after: last } : {}, signal);
        let incoming = page.entries;

        while (last && page.hasMore && page.entries.length) {
          last = page.entries.at(-1)?.sequence;

          if (!last) {
            break;
          }

          page = await getFeed(id, { after: last }, signal);
          incoming = mergeEntries(incoming, page.entries);
        }

        const latest = client.getQueryData<Conversation>(key);

        if (latest && latest.meetingRevision !== page.meetingRevision) {
          void client.invalidateQueries({
            queryKey: privateKey(user, id, access.epoch, 'details'),
          });
          void client.invalidateQueries({
            queryKey: privateKey(user, id, access.epoch, 'participants'),
          });
          void client.invalidateQueries({ queryKey: ['meetings', user] });
        }

        return {
          ...page,
          entries: mergeEntries(latest?.entries ?? [], incoming),
          hasOlder: latest?.hasOlder ?? page.hasMore,
        };
      }),
  });

  const loadOlder = async () => {
    const current = client.getQueryData<Conversation>(key);
    const first = current?.entries[0]?.sequence;

    if (!first || loadingOlder) {
      return;
    }

    setLoadingOlder(true);
    setHistoryError(null);

    try {
      const page = await guarded(client, user, id, access.epoch, () =>
        getFeed(id, { before: first }),
      );

      client.setQueryData<Conversation>(key, (latest) =>
        latest
          ? {
              ...latest,
              entries: mergeEntries(page.entries, latest.entries),
              hasOlder: page.hasMore,
            }
          : undefined,
      );

      return page.entries.length > 0;
    } catch (error) {
      setHistoryError(error);

      return false;
    } finally {
      setLoadingOlder(false);
    }
  };

  return { ...query, access, loadOlder, historyError, loadingOlder };
};
