import { expect, it } from 'vitest';
import type { MeetingDraft } from '@/entities/meeting';
import { rebaseDraft } from '@/features/edit-meeting/model/rebaseDraft';

it('preserves local title and cover removal while adopting an untouched concurrent schedule', () => {
  const previous: MeetingDraft = {
    title: 'Ужин',
    description: '',
    place: 'Кафе',
    localTime: '2026-11-06T20:00',
    timezone: 'Europe/Moscow',
    timeChoice: '',
  };

  const current = {
    ...previous,
    title: 'Другой ужин',
    localTime: '2026-11-07T19:00',
    description: 'Новый текст',
  };

  expect(
    rebaseDraft({ ...previous, title: 'Мой ужин', cover: null }, previous, current),
  ).toEqual({ ...current, title: 'Мой ужин', cover: null });
  expect(
    rebaseDraft(
      { ...previous, localTime: '2026-11-08T18:00', timeChoice: 'later' },
      previous,
      current,
    ),
  ).toMatchObject({
    title: current.title,
    localTime: '2026-11-08T18:00',
    timeChoice: 'later',
  });
});
