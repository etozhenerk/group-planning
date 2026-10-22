import { expect, it } from 'vitest';
import { entryPresentation } from '@/entities/meeting/lib/entryPresentation';
import type { FeedEntry } from '@/entities/meeting/model/types';

const entry: FeedEntry = {
  id: 'entry',
  meetingId: 'meeting',
  sequence: '1',
  kind: 'meeting_created',
  actor: { id: 'user', displayName: 'Саша' },
  occurredAt: '2026-10-23T10:00:00Z',
  clientRequestId: null,
  text: null,
  event: 'Саша создал встречу',
  supported: true,
  sender: { id: 'bot', kind: 'bot', displayName: 'Бот' },
};

it('keeps ordinary events centered even with an older bot sender', () => {
  for (const kind of [
    'meeting_created',
    'meeting_updated',
    'participant_joined',
    'participant_left',
    'rsvp_changed',
    'meeting_time_unspecified',
  ]) {
    expect(entryPresentation({ ...entry, kind })).toBe('system');
  }
});
it('only renders supported poll notifications as bot messages', () => {
  for (const kind of [
    'date_poll_applied',
    'date_poll_no_majority',
    'date_poll_choice_required',
    'date_poll_time_required',
    'date_poll_cancelled',
  ]) {
    expect(entryPresentation({ ...entry, kind })).toBe('notification');
  }

  expect(entryPresentation({ ...entry, kind: 'future_event', supported: false })).toBe(
    'system',
  );
  expect(entryPresentation({ ...entry, kind: 'message', text: 'Привет' })).toBe(
    'message',
  );
  expect(entryPresentation({ ...entry, kind: 'date_poll_created', pollId: 'poll' })).toBe(
    'poll',
  );
});
