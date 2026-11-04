import { calendarSchema, request } from '@/shared/api';
import { mapSummary } from '@/entities/meeting/lib/mapMeeting';
import type { CalendarFilter, CalendarPage } from '@/entities/meeting/model/calendar';

export const listCalendar = async (
  filter: CalendarFilter,
  cursor: string | null,
  signal?: AbortSignal,
): Promise<CalendarPage> => {
  const params = new URLSearchParams({ period: filter.period, limit: '50' });

  if (filter.from && filter.to) {
    params.set('from', filter.from);
    params.set('to', filter.to);
  }

  if (cursor) {
    params.set('cursor', cursor);
  }

  const wire = await request(calendarSchema, `/meetings?${params}`, {
    ...(signal ? { signal } : {}),
  });

  return {
    meetings: wire.meetings.map((meeting) => ({
      ...mapSummary(meeting),
      localDate: meeting.local_date,
      period: meeting.period,
    })),
    nextCursor: wire.next_cursor,
    asOf: wire.as_of,
    counts: wire.counts,
    days: wire.days,
    nextTransitionAt: wire.next_transition_at,
    refreshAfterSeconds: wire.refresh_after_seconds,
  };
};
