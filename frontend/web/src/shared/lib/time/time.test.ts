import { describe, expect, it } from 'vitest';
import { editLocalTime, resolveTime, timeLabel } from '@/shared/lib/time/resolveTime';

describe('meeting time', () => {
  it('converts Moscow local time with its actual offset', () => {
    expect(resolveTime('2026-10-24T19:00', 'Europe/Moscow')).toBe(
      '2026-10-24T19:00:00+03:00',
    );
    expect(editLocalTime('2026-10-24T16:00:00Z', 'Europe/Moscow')).toBe(
      '2026-10-24T19:00',
    );
  });
  it('requires a decision for a repeated DST time and rejects a skipped hour', () => {
    expect(() => resolveTime('2026-11-01T01:30', 'America/New_York')).toThrow('дважды');
    expect(resolveTime('2026-11-01T01:30', 'America/New_York', 'earlier')).toContain(
      '-04:00',
    );
    expect(resolveTime('2026-11-01T01:30', 'America/New_York', 'later')).toContain(
      '-05:00',
    );
    expect(() => resolveTime('2026-03-08T02:30', 'America/New_York')).toThrow(
      'этого времени нет',
    );
  });
  it('never fabricates a date for an undated meeting', () => {
    expect(timeLabel(null, 'Europe/Moscow')).toBe('Дата ещё не выбрана');
  });
});
