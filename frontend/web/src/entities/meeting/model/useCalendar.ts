import { useEffect } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import type { InfiniteData } from '@tanstack/react-query';
import { ApiError } from '@/shared/api';
import { listCalendar } from '@/entities/meeting/api/calendar';
import { calendarRefreshDelay } from '@/entities/meeting/lib/calendarRefresh';
import type { CalendarFilter, CalendarPage } from '@/entities/meeting/model/calendar';

export const useCalendar = (user: string, filter: CalendarFilter, enabled = true) => {
  const client = useQueryClient();
  const { period, from, to } = filter;
  const query = useInfiniteQuery({
    queryKey: ['meetings', user, 'calendar', period, from, to],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => listCalendar(filter, pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
    enabled: !!user && enabled,
    retry: false,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    refetchInterval: (current) =>
      calendarRefreshDelay(
        current.state.data?.pages[0],
        current.state.dataUpdatedAt,
        Date.now(),
        current.state.errorUpdatedAt > current.state.dataUpdatedAt
          ? current.state.errorUpdateCount
          : 0,
      ),
  });

  const changed =
    query.error instanceof ApiError && query.error.code === 'calendar_changed';

  useEffect(() => {
    if (!changed || !enabled) {
      return;
    }

    const queryKey = ['meetings', user, 'calendar', period, from, to];
    // Drop the obsolete continuation before rebuilding, preserving the UI filter.
    client.setQueryData<InfiniteData<CalendarPage, string | null>>(queryKey, (data) =>
      data
        ? {
            pages: data.pages.slice(0, 1),
            pageParams: [null],
          }
        : undefined,
    );
    void client.invalidateQueries({ queryKey, exact: true });
  }, [changed, enabled, client, user, period, from, to, query.errorUpdatedAt]);

  return query;
};
