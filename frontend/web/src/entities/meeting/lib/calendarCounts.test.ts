import { expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { readCalendarCounts } from '@/entities/meeting/lib/calendarCounts';
import type { CalendarPage } from '@/entities/meeting/model/calendar';

const store = (
  client: QueryClient,
  user: string,
  period: string,
  total: number,
  asOf: string,
  updatedAt: number,
) => {
  const page: CalendarPage = {
    meetings: [],
    nextCursor: null,
    asOf,
    counts: { upcoming: total, past: 0, undated: 0 },
    days: [],
    nextTransitionAt: null,
    refreshAfterSeconds: 5,
  };

  client.setQueryData(
    ['meetings', user, 'calendar', period],
    { pages: [page], pageParams: [null] },
    { updatedAt },
  );

  return page.counts;
};

it('keeps confirmed account counts when the requested period has no cached page', () => {
  const client = new QueryClient();
  const counts = store(client, 'sasha', 'upcoming', 0, '2026-10-22T12:00:00Z', 10);
  expect(readCalendarCounts(client, 'sasha')).toBe(counts);
  expect(client.getQueryData(['meetings', 'sasha', 'calendar', 'past'])).toBeUndefined();
  expect(readCalendarCounts(client, 'sasha')).toBe(counts);
  client.clear();
});

it('does not reuse counts from another profile or after clearing private queries', () => {
  const client = new QueryClient();
  store(client, 'sasha', 'upcoming', 0, '2026-10-22T12:00:00Z', 10);
  expect(readCalendarCounts(client, 'lena')).toBeUndefined();
  client.removeQueries({ queryKey: ['meetings', 'sasha'] });
  expect(readCalendarCounts(client, 'sasha')).toBeUndefined();
  client.clear();
});

it('prefers newer server data over a late response and compares fractional seconds numerically', () => {
  const client = new QueryClient();
  const newest = store(client, 'sasha', 'upcoming', 1, '2026-10-22T12:00:00.100Z', 10);
  store(client, 'sasha', 'past', 0, '2026-10-22T12:00:00Z', 20);
  expect(readCalendarCounts(client, 'sasha')).toBe(newest);
  const sameTime = store(client, 'sasha', 'undated', 2, '2026-10-22T12:00:00.100Z', 30);
  expect(readCalendarCounts(client, 'sasha')).toBe(sameTime);
  client.clear();
});
