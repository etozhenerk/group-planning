import { describe, expect, it } from 'vitest';
import {
  addDays,
  changeMonth,
  monthDays,
  monthRange,
  validDay,
} from '@/pages/meetings/lib/calendarDates';

describe('calendar dates independent of elapsed hours', () => {
  it('clamps the selected day and crosses years', () => {
    expect(changeMonth('2028-01-31', 1)).toBe('2028-02-29');
    expect(changeMonth('2027-01-31', 1)).toBe('2027-02-28');
    expect(changeMonth('2026-12-31', 1)).toBe('2027-01-31');
    expect(changeMonth('2027-01-31', -1)).toBe('2026-12-31');
  });
  it('keeps a Monday-first six-week grid including February and DST dates', () => {
    expect(monthRange('2026-10-24')).toEqual({ from: '2026-09-28', to: '2026-11-09' });
    expect(monthDays('2028-02-01')).toHaveLength(42);
    expect(monthDays('2028-02-01')).toContain('2028-02-29');
    expect(addDays('2026-03-29', 1)).toBe('2026-03-30');
  });
  it('rejects invalid dates in a saved URL', () => {
    expect(validDay('2026-02-30')).toBeNull();
    expect(validDay('2026-10-24T00:00')).toBeNull();
    expect(validDay('2028-02-29')).toBe('2028-02-29');
  });
});
