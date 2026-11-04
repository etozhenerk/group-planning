import type { CalendarPage } from '@/entities/meeting/model/calendar';

export const calendarRefreshDelay = (
  page: CalendarPage | undefined,
  updatedAt: number,
  now: number,
  errors = 0,
): number => {
  const interval = (page?.refreshAfterSeconds ?? 5) * 1000;

  if (errors > 0) {
    return Math.min(60_000, interval * 2 ** Math.min(errors, 4));
  }

  if (!page?.nextTransitionAt) {
    return interval;
  }

  // Use the server's clock; a device clock may be wrong. An overdue worker gets
  // the normal polling interval, never a tight loop or a client-side transition.
  const remaining =
    Date.parse(page.nextTransitionAt) - Date.parse(page.asOf) - (now - updatedAt);

  return remaining > 0 ? Math.max(100, Math.min(interval, remaining)) : interval;
};
