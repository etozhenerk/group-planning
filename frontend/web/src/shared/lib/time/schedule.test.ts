import { expect, it } from 'vitest';
import { resolveSchedule, timeLabel } from '@/shared/lib/time';

it('keeps a civil date without manufacturing midnight', () => {
  expect(resolveSchedule('2026-10-25T', 'Europe/Moscow')).toEqual({
    starts_on: '2026-10-25',
    starts_at: null,
  });
  expect(timeLabel(null, 'Europe/Moscow', '2026-10-25')).toBe(
    '25 октября · время пока не выбрано',
  );
  expect(() => resolveSchedule('T19:00', 'Europe/Moscow')).toThrow('Выберите дату');
});
it('preserves explicit time and requires an explicit repeated-hour choice', () => {
  expect(resolveSchedule('2026-11-01T01:30', 'America/New_York', 'later')).toEqual({
    starts_on: '2026-11-01',
    starts_at: '2026-11-01T01:30:00-05:00',
  });
  expect(() => resolveSchedule('2026-11-01T01:30', 'America/New_York')).toThrow('дважды');
  expect(() => resolveSchedule('2026-03-08T02:30', 'America/New_York')).toThrow(
    'времени нет',
  );
});
