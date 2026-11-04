import { getFeed } from '@/entities/meeting/api/read';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import type { FeedEntry } from '@/entities/meeting/model/types';

export const refreshLegacyEntries = async (
  id: string,
  entries: FeedEntry[],
  signal?: AbortSignal,
) => {
  const pending = new Map(
    mergeEntries([], entries)
      .filter((entry) => !entry.delivery && BigInt(entry.sequence) > 0n)
      .map((entry) => [entry.id, entry]),
  );

  const refreshed: FeedEntry[] = [];
  const removed = new Set<string>();

  // Read only ranges containing cached rows, including a protected focus row.
  // An ACK far ahead must not cause a scan of all intervening history.
  while (pending.size > 0) {
    signal?.throwIfAborted();
    const first = pending.values().next().value;

    if (!first) {
      break;
    }

    const page = await getFeed(
      id,
      { after: (BigInt(first.sequence) - 1n).toString() },
      signal,
    );

    signal?.throwIfAborted();

    for (const entry of page.entries) {
      if (pending.delete(entry.id)) {
        refreshed.push(entry);
      }
    }

    if (pending.delete(first.id)) {
      removed.add(first.id);
    }
  }

  return { refreshed, removed };
};
