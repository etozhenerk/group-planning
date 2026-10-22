import { z } from 'zod';
import { pollEvent } from '@/entities/meeting/lib/pollEvent';
import type { WireEntry, WireFeed } from '@/shared/api';
import type { FeedEntry, FeedPage } from '@/entities/meeting/model/types';

const responsePayload = z.object({ answer: z.enum(['going', 'maybe', 'not_going']) });
const updatePayload = z.object({
  previous: z.object({
    title: z.string(),
    description: z.string(),
    starts_at: z.string().nullable(),
    starts_on: z.string().nullable().optional(),
    timezone: z.string(),
    place: z.string(),
  }),
  current: z.object({
    title: z.string(),
    description: z.string(),
    starts_at: z.string().nullable(),
    starts_on: z.string().nullable().optional(),
    timezone: z.string(),
    place: z.string(),
  }),
});

export const answerLabels = { going: 'Приду', maybe: 'Возможно', not_going: 'Не смогу' };

export const mapEntry = (wire: WireEntry): FeedEntry => {
  let text: string | null = null;
  let event = 'Эта запись пока не поддерживается.';
  let supported = false;

  if (wire.payload_version === 1) {
    if (wire.kind === 'message') {
      const parsed = z.object({ text: z.string() }).safeParse(wire.payload);

      if (parsed.success) {
        text = parsed.data.text;
        supported = true;
      }
    } else if (wire.kind === 'meeting_created') {
      event = `${wire.actor.display_name} создал встречу`;
      supported = true;
    } else if (wire.kind === 'meeting_updated') {
      const parsed = updatePayload.safeParse(wire.payload);

      if (parsed.success) {
        const { previous, current } = parsed.data;
        const changes: string[] = [];

        if (previous.title !== current.title) {
          changes.push(`название: ${current.title}`);
        }

        if (previous.place !== current.place) {
          changes.push(
            current.place ? `место: ${current.place}` : 'место пока не выбрано',
          );
        }

        if (
          previous.starts_on !== current.starts_on ||
          previous.starts_at !== current.starts_at ||
          previous.timezone !== current.timezone
        ) {
          changes.push('дату и время');
        }

        if (previous.description !== current.description) {
          changes.push('описание');
        }

        event = `${wire.actor.display_name} изменил ${changes.join(', ') || 'детали встречи'}`;
        supported = true;
      }
    } else if (
      ['participant_joined', 'participant_left', 'rsvp_changed'].includes(wire.kind)
    ) {
      const parsed = responsePayload.safeParse(wire.payload);

      if (parsed.success) {
        event = `${wire.actor.display_name} ответил «${answerLabels[parsed.data.answer]}»`;
        supported = true;
      }
    }
  }

  const notice = pollEvent(wire);

  return {
    id: wire.id,
    meetingId: wire.meeting_id,
    sequence: wire.sequence,
    kind: wire.kind,
    actor: { id: wire.actor.id, displayName: wire.actor.display_name },
    occurredAt: wire.occurred_at,
    clientRequestId: wire.client_request_id,
    text,
    event: notice?.event ?? event,
    supported: supported || notice !== null,
    ...(notice?.pollId ? { pollId: notice.pollId } : {}),
    ...(wire.sender
      ? {
          sender: {
            kind: wire.sender.kind,
            id: wire.sender.id,
            displayName: wire.sender.display_name,
          },
        }
      : {}),
  };
};

export const mapFeed = (wire: WireFeed): FeedPage => {
  return {
    entries: wire.entries.map(mapEntry),
    hasMore: wire.has_more,
    latestSequence: wire.latest_sequence,
    meetingRevision: wire.meeting_revision,
    participantCount: wire.participant_count,
    myRsvp: wire.my_rsvp,
    myRsvpRevision: wire.my_rsvp_revision,
  };
};

export const mergeEntries = (a: FeedEntry[], b: FeedEntry[]): FeedEntry[] => {
  return [...new Map([...a, ...b].map((entry) => [entry.id, entry])).values()].sort(
    (left, right) =>
      BigInt(left.sequence) < BigInt(right.sequence)
        ? -1
        : BigInt(left.sequence) > BigInt(right.sequence)
          ? 1
          : 0,
  );
};
