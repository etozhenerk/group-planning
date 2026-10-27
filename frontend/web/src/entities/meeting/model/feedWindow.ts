import { boundChatMetadata } from '@/entities/meeting/model/boundChatMetadata';
import { mergeEntries } from '@/entities/meeting/lib/mapFeed';
import type { Conversation, FeedEntry } from '@/entities/meeting/model/types';

export type FeedPosition = {
  entryId: string | null;
  offset: number;
  following: boolean;
  focusedId: string | null;
};

export type FeedWindow = {
  revision: number;
  id: string;
  first: string | null;
  last: string | null;
  hasNewer: boolean;
};

export const feedWindow = (
  entries: FeedEntry[],
  hasNewer = false,
  id: string = crypto.randomUUID(),
  revision = 0,
): FeedWindow => ({
  id,
  revision,
  first: entries[0]?.sequence ?? null,
  last: entries.at(-1)?.sequence ?? null,
  hasNewer,
});

export const boundConversation = (
  previous: Conversation | undefined,
  incoming: Conversation,
  position?: FeedPosition,
): Conversation => {
  const incomingRange = incoming.window;
  const stale =
    incomingRange &&
    previous?.window?.id === incomingRange.id &&
    previous.window.revision > incomingRange.revision;

  const range = stale ? previous.window : incomingRange;
  const sameWindow =
    previous &&
    (range
      ? previous.window?.id === range.id ||
        (!previous.window && !previous.sync && !incoming.sync)
      : !incoming.sync || previous.sync?.window === incoming.sync.window);

  const merged = mergeEntries(sameWindow ? previous.entries : [], incoming.entries);
  const first =
    !stale &&
    sameWindow &&
    incoming.entries[0] &&
    range?.first &&
    BigInt(incoming.entries[0].sequence) < BigInt(range.first)
      ? incoming.entries[0].sequence
      : range?.first;

  const available = merged.filter(
    (entry) =>
      !incoming.sync?.removed.includes(entry.id) &&
      (!first || BigInt(entry.sequence) >= BigInt(first)) &&
      (!range?.hasNewer || !range.last || BigInt(entry.sequence) <= BigInt(range.last)),
  );

  const anchor = available.findIndex((entry) => entry.id === position?.entryId);
  const start = Math.max(
    0,
    Math.min(
      available.length - 500,
      position && !position.following && anchor >= 0 ? anchor - 250 : available.length,
    ),
  );

  const entries = available.slice(start, start + 500);
  const hasNewer =
    !!(range?.hasNewer ?? incoming.sync?.hasNewer) || start + 500 < available.length;

  const focused = position?.focusedId
    ? [
        ...merged,
        ...(incoming.protectedEntries ?? []),
        ...(previous?.entries ?? []),
        ...(previous?.protectedEntries ?? []),
      ].find((entry) => entry.id === position.focusedId)
    : undefined;

  const protectedEntries =
    focused &&
    !entries.some((entry) => entry.id === focused.id) &&
    !incoming.sync?.removed.includes(focused.id)
      ? [focused]
      : [];

  return {
    ...incoming,
    entries,
    protectedEntries,
    hasOlder:
      start > 0 ||
      (sameWindow ? previous.hasOlder && incoming.hasOlder : incoming.hasOlder),
    window: feedWindow(
      entries,
      hasNewer,
      range?.id ?? incoming.sync?.window ?? previous?.window?.id,
      (range?.revision ?? 0) + 1,
    ),
    ...(incoming.sync
      ? {
          sync: {
            ...boundChatMetadata(incoming.sync, [...entries, ...protectedEntries]),
            hasNewer,
          },
        }
      : {}),
  };
};
