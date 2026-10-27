import { expect, it } from 'vitest';
import {
  applyChatChanges,
  snapshotConversation,
} from '@/entities/meeting/model/chatState';
import type { ChatChanges, ChatSnapshot } from '@/entities/meeting/model/chatSchema';
import { shareConversation } from '@/entities/meeting/model/shareConversation';

const meeting = {
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

const entry = (sequence: string, text = sequence) => ({
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

const snapshot = (): ChatSnapshot => ({
  mode: 'snapshot',
  stream_epoch: 'epoch',
  change_cursor: 'cursor:100',
  entries: [entry('100')],
  projections: [],
  meeting,
  projection_version: '100',
  latest_sequence: '100',
  range: { first_sequence: '100', last_sequence: '100' },
  has_older: true,
  has_newer: false,
  my_read_state: null,
  first_unread: null,
});

const changes = (version: string, text: string): ChatChanges => ({
  mode: 'changes',
  stream_epoch: 'epoch',
  next_cursor: `cursor:${version}`,
  through_cursor: 'through',
  has_more: false,
  meeting,
  projection_version: version,
  changes: [
    {
      kind: 'entry_upsert',
      projection_version: version,
      projection: {
        resource_kind: 'entry',
        resource_id: '100',
        projection_version: version,
        entry: entry('100', text),
      },
    },
  ],
});

it('applies current projection versions without reducing decimal precision or moving receive/read positions', () => {
  const initial = snapshotConversation(snapshot());
  const latest = applyChatChanges(initial, changes('18446744073709551615', 'Новое'));
  const replayed = applyChatChanges(latest, changes('18446744073709551614', 'Старое'));
  expect(replayed.entries[0]?.text).toBe('Новое');
  expect(initial.entries[0]?.text).toBe('100');
  expect(replayed.receiveCursor).toBe('0');
  expect(replayed.sync?.cursor).toBe('cursor:18446744073709551614');
});

it('does not resurrect removed entries through structural sharing and drops old windows on reset', () => {
  const initial = snapshotConversation(snapshot());
  const page = changes('101', '');
  page.changes = [{ kind: 'entry_removed', entry_id: '100', projection_version: '101' }];
  const removed = applyChatChanges(initial, page);
  expect(shareConversation(initial, removed)).toMatchObject({
    entries: [],
    sync: { cursor: 'cursor:101' },
  });
  const next = snapshot();
  next.entries = [entry('200')];
  expect(shareConversation(initial, snapshotConversation(next))).toMatchObject({
    entries: [{ id: '200' }],
  });
});

it('does not mutate state or advance its cursor when page application fails', () => {
  const initial = snapshotConversation(snapshot());
  const page = changes('bad', 'Нельзя применить');
  expect(() => applyChatChanges(initial, page)).toThrow();
  expect(initial.sync?.cursor).toBe('cursor:100');
  expect(initial.entries[0]?.text).toBe('100');
});
