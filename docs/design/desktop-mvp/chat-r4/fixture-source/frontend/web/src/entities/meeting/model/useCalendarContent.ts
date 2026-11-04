import { useState } from 'react';
import type { InfiniteData } from '@tanstack/react-query';
import type { CalendarFilter, CalendarPage } from '@/entities/meeting/model/calendar';

export const useCalendarContent = (
  user: string,
  period: CalendarFilter['period'],
  data: InfiniteData<CalendarPage> | undefined,
  available: boolean,
) => {
  const current = available ? data : undefined;
  const [previous, setPrevious] = useState({ user, period, data: current });
  const sameScope = previous.user === user && previous.period === period;

  if (!sameScope || !available || (current && current !== previous.data)) {
    if (!sameScope || previous.data !== current) {
      setPrevious({ user, period, data: current });
    }
  }

  // This is presentation continuity, never a successful cache entry for another day.
  return available ? (current ?? (sameScope ? previous.data : undefined)) : undefined;
};
