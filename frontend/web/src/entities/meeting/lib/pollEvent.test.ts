import { expect, it } from 'vitest';
import { entrySchema } from '@/shared/api';
import { mapEntry } from '@/entities/meeting/lib/mapFeed';

const base = {
  id: '00000000-0000-4000-8000-000000000001',
  meeting_id: '00000000-0000-4000-8000-000000000002',
  sequence: '5',
  payload_version: 1,
  actor: { id: '00000000-0000-4000-8000-000000000003', display_name: 'Лена' },
  sender: {
    id: 'b47f6000-0000-4000-8000-000000000001',
    display_name: 'Бот',
    kind: 'bot',
  },
  occurred_at: '2026-10-23T10:00:00Z',
  client_request_id: null,
};

it('keeps the human actor while presenting the notification as a bot', () => {
  const entry = mapEntry(
    entrySchema.parse({
      ...base,
      kind: 'date_poll_applied',
      payload: { poll_id: base.id, current: { starts_on: '2026-10-25' } },
    }),
  );

  expect(entry.actor.displayName).toBe('Лена');
  expect(entry.sender?.kind).toBe('bot');
  expect(entry.event).toContain('25 октября');
  expect(entry.supported).toBe(true);
});
it('only creates an interactive card for a supported poll creation payload', () => {
  expect(
    mapEntry(
      entrySchema.parse({
        ...base,
        kind: 'date_poll_created',
        payload: { poll_id: base.id },
      }),
    ).pollId,
  ).toBe(base.id);
  expect(
    mapEntry(
      entrySchema.parse({
        ...base,
        kind: 'date_poll_created',
        payload: { poll_id: 'invalid' },
      }),
    ).pollId,
  ).toBeUndefined();
  expect(
    mapEntry(
      entrySchema.parse({
        ...base,
        kind: 'date_poll_created',
        payload_version: 2,
        payload: { poll_id: base.id },
      }),
    ).supported,
  ).toBe(false);
});

it('confirms the original day without claiming that the meeting moved', () => {
  const entry = mapEntry(
    entrySchema.parse({
      ...base,
      kind: 'date_poll_applied',
      payload: {
        poll_id: base.id,
        previous: { starts_on: '2026-10-25' },
        current: { starts_on: '2026-10-25' },
      },
    }),
  );

  expect(entry.event).toBe('Дату подтвердили: встречаемся 25 октября.');
});
