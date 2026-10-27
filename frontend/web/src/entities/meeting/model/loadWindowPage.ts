import type { QueryClient } from '@tanstack/react-query';
import { getFeed } from '@/entities/meeting/api/read';
import { guarded, privateKey } from '@/entities/meeting/model/access';
import { feedWindow } from '@/entities/meeting/model/feedWindow';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import type { Conversation } from '@/entities/meeting/model/types';

export const loadWindowPage = async (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  direction: 'older' | 'newer',
  signal?: AbortSignal,
) => {
  const key = privateKey(user, id, epoch, 'feed');
  const before = client.getQueryData<Conversation>(key);
  const boundary = direction === 'older' ? before?.entries[0] : before?.entries.at(-1);

  if (!boundary) {
    return false;
  }

  const page = await guarded(client, user, id, epoch, () =>
    getFeed(
      id,
      direction === 'older'
        ? { before: boundary.sequence }
        : { after: boundary.sequence },
      signal,
    ),
  );

  signal?.throwIfAborted();
  const latest = client.getQueryData<Conversation>(key);

  const currentBoundary =
    direction === 'older' ? latest?.entries[0] : latest?.entries.at(-1);

  if (
    !latest ||
    latest.window?.id !== before?.window?.id ||
    currentBoundary?.sequence !== boundary.sequence
  ) {
    throw new DOMException('Stale feed window', 'AbortError');
  }

  const entries = mergeEntries(page.entries, latest.entries);
  client.setQueryData<Conversation>(key, {
    ...latest,
    entries,
    hasOlder: direction === 'older' ? page.hasMore : latest.hasOlder,
    window: feedWindow(
      entries,
      direction === 'newer' ? page.hasMore : latest.window?.hasNewer,
      latest.window?.id,
      latest.window?.revision,
    ),
  });

  return page.entries.length > 0;
};
