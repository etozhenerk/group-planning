import { pageReadState } from '@/entities/meeting/model/readProjection';
import { feedWindow } from '@/entities/meeting/model/feedWindow';
import { mapEntry, mergeEntries } from '@/entities/meeting/lib/mapFeed';
import type {
  ChatChanges,
  ChatProjection,
  ChatSnapshot,
} from '@/entities/meeting/model/chatSchema';
import type { Conversation } from '@/entities/meeting/model/types';

export type ChatState = {
  cursor: string;
  streamEpoch: string;
  window: string;
  versions: Record<string, string>;
  removed: string[];
  projections: ChatProjection[];
  hasNewer: boolean;
};

export const snapshotConversation = (page: ChatSnapshot): Conversation => ({
  entries: page.entries.map(mapEntry),
  read: pageReadState(page),
  window: feedWindow(page.entries.map(mapEntry), page.has_newer),
  hasMore: page.has_newer,
  hasOlder: page.has_older,
  latestSequence: page.latest_sequence,
  receiveCursor: '0',
  meetingRevision: page.meeting.revision,
  participantCount: page.meeting.participant_count,
  myRsvp: page.meeting.my_rsvp,
  myRsvpRevision: page.meeting.my_rsvp_revision,
  sync: {
    cursor: page.change_cursor,
    streamEpoch: page.stream_epoch,
    window: crypto.randomUUID(),
    versions: Object.fromEntries(
      page.projections.map((p) => [
        `${p.resource_kind}:${p.resource_id}`,
        p.projection_version,
      ]),
    ),
    removed: [],
    projections: page.projections,
    hasNewer: page.has_newer,
  },
});

export const applyChatChanges = (
  previous: Conversation,
  page: ChatChanges,
  user?: string,
): Conversation => {
  if (!previous.sync || previous.sync.streamEpoch !== page.stream_epoch) {
    throw new Error('Chat stream changed');
  }

  const versions = { ...previous.sync.versions };
  const removed = new Set(previous.sync.removed);
  let entries = previous.entries;
  let protectedEntries = previous.protectedEntries ?? [];
  let latestSequence = previous.latestSequence;
  let newMessages = previous.newMessages ?? 0;
  const projections: ChatProjection[] = [];

  for (const change of page.changes) {
    const projection = change.projection;
    const key = projection
      ? `${projection.resource_kind}:${projection.resource_id}`
      : `entry:${change.entry_id}`;

    const version = projection?.projection_version ?? change.projection_version;

    if (BigInt(versions[key] ?? '0') > BigInt(version)) {
      continue;
    }

    versions[key] = version;

    if (change.kind === 'entry_removed' && change.entry_id) {
      entries = entries.filter((entry) => entry.id !== change.entry_id);
      protectedEntries = protectedEntries.filter((entry) => entry.id !== change.entry_id);
      removed.add(change.entry_id);
    }

    if (projection) {
      projections.push(projection);

      if (projection.entry) {
        if (BigInt(projection.entry.sequence) > BigInt(latestSequence)) {
          latestSequence = projection.entry.sequence;

          if (
            user &&
            projection.entry.kind === 'message' &&
            projection.entry.actor.id !== user
          ) {
            newMessages += 1;
          }
        }

        removed.delete(projection.entry.id);

        if (protectedEntries.some((entry) => entry.id === projection.entry?.id)) {
          protectedEntries = mergeEntries(protectedEntries, [mapEntry(projection.entry)]);
        }

        const range = previous.window;

        if (
          (!range?.first || BigInt(projection.entry.sequence) >= BigInt(range.first)) &&
          (!range?.hasNewer ||
            !range.last ||
            BigInt(projection.entry.sequence) <= BigInt(range.last))
        ) {
          entries = mergeEntries(entries, [mapEntry(projection.entry)]);
        }
      }
    }
  }

  return {
    ...previous,
    read: pageReadState(page, previous.read),
    entries,
    protectedEntries,
    latestSequence,
    newMessages,
    meetingRevision: page.meeting.revision,
    participantCount: page.meeting.participant_count,
    myRsvp: page.meeting.my_rsvp,
    myRsvpRevision: page.meeting.my_rsvp_revision,
    sync: {
      ...previous.sync,
      cursor: page.next_cursor,
      versions,
      removed: [...removed],
      projections,
    },
  };
};
