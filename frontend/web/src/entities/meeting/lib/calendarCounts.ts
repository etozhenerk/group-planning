import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import type { CalendarPage } from '@/entities/meeting/model/calendar';

export const readCalendarCounts = (client: QueryClient, user: string) => {
  const snapshots = client.getQueriesData<InfiniteData<CalendarPage>>({
    queryKey: ['meetings', user, 'calendar'],
  });

  let newest: { page: CalendarPage; receivedAt: number } | undefined;

  for (const [key, data] of snapshots) {
    const page = data?.pages[0];

    if (!page) {
      continue;
    }

    const receivedAt = client.getQueryState(key)?.dataUpdatedAt ?? 0;
    const serverTime = Date.parse(page.asOf);
    const newestTime = newest ? Date.parse(newest.page.asOf) : -Infinity;

    if (
      serverTime > newestTime ||
      (serverTime === newestTime && receivedAt > (newest?.receivedAt ?? 0))
    ) {
      newest = { page, receivedAt };
    }
  }

  return newest?.page.counts;
};
