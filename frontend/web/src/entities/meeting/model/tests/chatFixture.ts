import type { ChatChanges, ChatSnapshot } from '@/entities/meeting/model/chatSchema';

export const chatMeeting = {
  id: 'meeting',
  organizer_id: 'user',
  title: 'Встреча',
  description: null,
  starts_on: null,
  starts_at: null,
  timezone: 'Europe/Moscow',
  place: null,
  cover_url: null,
  period: 'upcoming' as const,
  revision: '1',
  participant_count: 2,
  my_rsvp: 'going' as const,
  my_rsvp_revision: '1',
};

export const wireChatEntry = (sequence: string, text = sequence) => ({
  id: sequence,
  meeting_id: 'meeting',
  sequence,
  kind: 'message',
  payload_version: 1,
  actor: { id: 'user', display_name: 'Автор' },
  occurred_at: '2026-10-27T00:00:00Z',
  payload: { text },
  client_request_id: null,
});

export const chatSnapshot = (sequence = '100'): ChatSnapshot => ({
  mode: 'snapshot',
  stream_epoch: 'epoch',
  change_cursor: `cursor:${sequence}`,
  entries: [wireChatEntry(sequence)],
  projections: [],
  meeting: chatMeeting,
  projection_version: sequence,
  latest_sequence: sequence,
  range: { first_sequence: sequence, last_sequence: sequence },
  has_older: true,
  has_newer: false,
  my_read_state: null,
  first_unread: null,
});

export const chatChanges = (version: string, more = false): ChatChanges => ({
  mode: 'changes',
  stream_epoch: 'epoch',
  next_cursor: `cursor:${version}`,
  through_cursor: 'through',
  has_more: more,
  meeting: chatMeeting,
  projection_version: version,
  changes: [
    {
      kind: 'entry_upsert',
      projection_version: version,
      projection: {
        resource_kind: 'entry',
        resource_id: version,
        projection_version: version,
        entry: wireChatEntry(version),
      },
    },
  ],
});
