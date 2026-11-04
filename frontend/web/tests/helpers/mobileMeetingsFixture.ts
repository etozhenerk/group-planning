import { randomUUID } from 'node:crypto';
import type { Page } from '@playwright/test';
import { apiCreate } from '@tests/helpers';
import { mockCalendar } from '@tests/calendar-helpers';
import type { CalendarItem } from '@tests/calendar-helpers';

export const mobileMeetingsFixture = async (page: Page) => {
  const { meeting } = await apiCreate(page, 'Проверка возврата');
  const counts = ['0', '1', '2', '11', '21', '99', '100', '9007199254741021'];
  const items: CalendarItem[] = Array.from({ length: 20 }, (_, index) => ({
    ...meeting,
    id: index === 10 ? meeting.id : randomUUID(),
    title: index === 10 ? meeting.title : `Календарный вечер ${index + 1}`,
    starts_at: `2099-10-24T${String(index).padStart(2, '0')}:00:00Z`,
    local_date: '2099-10-24',
    period: 'upcoming',
    unread_count: counts[index % counts.length],
  }));

  await mockCalendar(page, items);

  return meeting;
};
