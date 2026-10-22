import { useCallback, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { readCalendarCounts } from '@/entities/meeting/lib/calendarCounts';

export const useCalendarCounts = (user: string) => {
  const client = useQueryClient();
  const subscribe = useCallback(
    (onChange: () => void) => client.getQueryCache().subscribe(onChange),
    [client],
  );

  const snapshot = useCallback(() => readCalendarCounts(client, user), [client, user]);

  // Counts describe the whole account, even while a different range is loading.
  return useSyncExternalStore(subscribe, snapshot, snapshot);
};
