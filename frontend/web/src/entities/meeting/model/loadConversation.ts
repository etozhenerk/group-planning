import type { QueryClient } from '@tanstack/react-query';
import { getFeed } from '@/entities/meeting/api/read';
import { feedWindow } from '@/entities/meeting/model/feedWindow';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import { guarded, privateKey } from '@/entities/meeting/model/access';
import type { Conversation, FeedEntry } from '@/entities/meeting/model/types';
import { refreshLegacyEntries } from '@/entities/meeting/model/refreshLegacyEntries';

export const loadConversation = (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  signal?: AbortSignal,
): Promise<Conversation> =>
  guarded(client, user, id, epoch, async () => {
    const key = privateKey(user, id, epoch, 'feed');
    const previous = client.getQueryData<Conversation>(key);

    if (previous && !previous.window) {
      client.setQueryData<Conversation>(key, {
        ...previous,
        window: feedWindow(previous.entries),
      });
    }

    let receiveCursor = previous?.receiveCursor ?? '0';
    let page = await getFeed(id, previous ? { after: receiveCursor } : {}, signal);
    let incoming = page.entries;
    let newMessages = previous?.newMessages ?? 0;
    const countNew = (items: typeof incoming) =>
      items.filter(
        (entry) =>
          entry.kind === 'message' &&
          entry.actor.id !== user &&
          BigInt(entry.sequence) >
            BigInt(previous?.latestSequence ?? page.latestSequence),
      ).length;

    newMessages += countNew(page.entries);

    while (true) {
      const next = incoming.at(-1)?.sequence ?? receiveCursor;
      const advanced = BigInt(next) > BigInt(receiveCursor);

      if (advanced) {
        receiveCursor = next;
      }

      if (!previous || !page.hasMore) {
        break;
      }

      if (!advanced) {
        throw new Error('Feed page did not advance the receive cursor');
      }

      page = await getFeed(id, { after: receiveCursor }, signal);
      newMessages += countNew(page.entries);
      incoming = mergeEntries(incoming, page.entries).slice(-500);
    }

    let latest = client.getQueryData<Conversation>(key);
    let removed = new Set<string>();
    let refreshedEntries: FeedEntry[] = [];

    if (latest && latest.meetingRevision !== page.meetingRevision) {
      const refreshed = await refreshLegacyEntries(
        id,
        [...latest.entries, ...(latest.protectedEntries ?? [])],
        signal,
      );

      removed = refreshed.removed;
      refreshedEntries = refreshed.refreshed;
      latest = client.getQueryData<Conversation>(key);
      incoming = mergeEntries(
        incoming,
        refreshedEntries.filter((entry) =>
          latest?.entries.some((value) => value.id === entry.id),
        ),
      );
      void client.invalidateQueries({ queryKey: privateKey(user, id, epoch, 'details') });
      void client.invalidateQueries({
        queryKey: privateKey(user, id, epoch, 'participants'),
      });
      void client.invalidateQueries({ queryKey: ['meetings', user] });
    }

    return {
      ...page,
      entries: mergeEntries(latest?.entries ?? [], incoming).filter(
        (entry) => !removed.has(entry.id),
      ),
      ...(latest?.protectedEntries
        ? {
            protectedEntries: mergeEntries(latest.protectedEntries, [
              ...incoming,
              ...refreshedEntries,
            ]).filter(
              (entry) =>
                latest?.protectedEntries?.some((value) => value.id === entry.id) &&
                !removed.has(entry.id),
            ),
          }
        : {}),
      hasOlder: latest?.hasOlder ?? page.hasMore,
      receiveCursor,
      newMessages,
      window: latest?.window ?? feedWindow(mergeEntries(latest?.entries ?? [], incoming)),
    };
  });

export { loadOlderConversation } from '@/entities/meeting/model/loadWindowHistory';
