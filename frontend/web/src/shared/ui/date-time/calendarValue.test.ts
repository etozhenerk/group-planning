import { describe, expect, it } from 'vitest';
import { calendarValue } from '@/shared/ui/date-time/calendarValue';
import { resolveTime } from '@/shared/lib/time';

describe('calendar field values', () => {
  it('represents the calendar date without shifting it through a local offset', () => {
    expect(calendarValue('2026-10-24')?.toISOString()).toBe('2026-10-24T00:00:00.000Z');
    expect(calendarValue('2028-02-29')?.format('YYYY-MM-DD')).toBe('2028-02-29');
  });

  it('does not fabricate an empty, partial or invalid date', () => {
    for (const value of ['', '2026-10', '2026-02-31', '2026-13-20']) {
      expect(calendarValue(value)).toBeNull();
    }
  });

  it('requires both parts and rejects invalid hours in the meeting timezone', () => {
    expect(() => resolveTime('2026-10-24T', 'Europe/Moscow')).toThrow('Выберите дату');
    expect(() => resolveTime('T19:00', 'Europe/Moscow')).toThrow('Выберите дату');
    expect(() => resolveTime('2026-10-24T25:00', 'Europe/Moscow')).toThrow(
      'Проверьте дату',
    );
  });
});
