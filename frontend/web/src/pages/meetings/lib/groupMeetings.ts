import type { CalendarMeeting } from '@/entities/meeting';
import { monthLabel } from '@/pages/meetings/lib/calendarDates';

export const groupMeetings = (meetings: CalendarMeeting[]) => {
  const groups = new Map<string, { title: string; meetings: CalendarMeeting[] }>();

  for (const meeting of meetings) {
    const key = meeting.localDate?.slice(0, 7) ?? 'undated';
    const group = groups.get(key) ?? {
      title: meeting.localDate ? monthLabel(meeting.localDate) : 'Без даты',
      meetings: [],
    };

    group.meetings.push(meeting);
    groups.set(key, group);
  }

  return [...groups.values()];
};
