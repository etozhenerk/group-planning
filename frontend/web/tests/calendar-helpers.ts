import type { Page } from '@playwright/test';
import type { z } from 'zod';
import type { calendarSchema } from '@/shared/api';
import { apiCreate } from '@tests/helpers';

export type CalendarWire = z.infer<typeof calendarSchema>;

export type CalendarItem = CalendarWire['meetings'][number];

export const calendarItems = async (page: Page): Promise<CalendarItem[]> => {
  const { meeting } = await apiCreate(page, 'Суббота без спешки');

  return [
    {
      ...meeting,
      title: 'Суббота без спешки',
      starts_at: '2026-10-24T16:00:00Z',
      local_date: '2026-10-24',
      period: 'upcoming',
    },
    {
      ...meeting,
      id: '00000000-0000-4000-8000-000000000002',
      title: 'Кино вечером',
      starts_at: '2026-10-31T15:00:00Z',
      local_date: '2026-10-31',
      period: 'upcoming',
    },
    {
      ...meeting,
      id: '00000000-0000-4000-8000-000000000003',
      title: 'Ужин после кино',
      starts_at: '2026-10-31T19:00:00Z',
      local_date: '2026-10-31',
      period: 'upcoming',
    },
    {
      ...meeting,
      id: '00000000-0000-4000-8000-000000000004',
      title: 'Уже встречались',
      starts_at: '2026-09-20T16:00:00Z',
      local_date: '2026-09-20',
      period: 'past',
    },
    {
      ...meeting,
      id: '00000000-0000-4000-8000-000000000005',
      title: 'Поход',
      starts_at: null,
      local_date: null,
      period: 'undated',
    },
  ];
};

export const calendarResponse = (items: CalendarItem[], url: string): CalendarWire => {
  const params = new URL(url).searchParams;
  const period = params.get('period');
  const from = params.get('from');
  const to = params.get('to');
  const filtered = items.filter(
    (item) =>
      item.period === period &&
      (!from ||
        !to ||
        (item.local_date && item.local_date >= from && item.local_date < to)),
  );

  const days = new Map<string, number>();

  for (const item of filtered) {
    if (from && item.local_date) {
      days.set(item.local_date, (days.get(item.local_date) ?? 0) + 1);
    }
  }

  return {
    meetings: filtered,
    next_cursor: null,
    as_of: '2026-10-22T12:00:00Z',
    counts: {
      upcoming: items.filter((item) => item.period === 'upcoming').length,
      past: items.filter((item) => item.period === 'past').length,
      undated: items.filter((item) => item.period === 'undated').length,
    },
    days: [...days].map(([date, count]) => ({ date, count })),
    next_transition_at: null,
    refresh_after_seconds: 5,
  };
};

export const mockCalendar = async (page: Page, items: CalendarItem[]) => {
  await page.route('**/api/v1/meetings?*', (route) =>
    route.fulfill({ json: calendarResponse(items, route.request().url()) }),
  );
};
