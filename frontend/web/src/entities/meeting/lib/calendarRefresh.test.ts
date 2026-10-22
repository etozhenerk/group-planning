import { expect, it } from 'vitest';
import { calendarRefreshDelay } from '@/entities/meeting/lib/calendarRefresh';
import type { CalendarPage } from '@/entities/meeting/model/calendar';

const page: CalendarPage = {
  meetings: [],
  nextCursor: null,
  counts: { upcoming: 1, past: 0, undated: 0 },
  days: [],
  asOf: '2026-10-24T20:59:58Z',
  nextTransitionAt: '2026-10-24T21:00:00Z',
  refreshAfterSeconds: 5,
};

it('refreshes at the server boundary regardless of device time', () => {
  expect(calendarRefreshDelay(page, 42_000, 42_000)).toBe(2_000);
  expect(calendarRefreshDelay(page, 42_000, 43_000)).toBe(1_000);
});

it('waits for a delayed worker without polling in a tight loop', () => {
  expect(calendarRefreshDelay(page, 42_000, 45_000)).toBe(5_000);
  expect(calendarRefreshDelay({ ...page, asOf: '2026-10-24T21:00:05Z' }, 100, 100)).toBe(
    5_000,
  );
});

it('backs off on network failure and caps the interval', () => {
  expect(calendarRefreshDelay(page, 0, 0, 1)).toBe(10_000);
  expect(calendarRefreshDelay(page, 0, 0, 9)).toBe(60_000);
});
