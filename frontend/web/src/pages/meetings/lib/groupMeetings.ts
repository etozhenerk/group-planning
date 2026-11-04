import type { CalendarMeeting } from '@/entities/meeting';
import { monthLabel, today } from '@/entities/meeting';

export const groupMeetings = (
  meetings: CalendarMeeting[],
  currentYear = today().slice(0, 4),
) => {
  const groups = new Map<
    string,
    { title: string; mobileTitle: string; meetings: CalendarMeeting[] }
  >();

  for (const meeting of meetings) {
    const key = meeting.localDate?.slice(0, 7) ?? 'undated';
    const title = meeting.localDate ? monthLabel(meeting.localDate) : 'Без даты';
    const group = groups.get(key) ?? {
      title,
      mobileTitle:
        meeting.localDate?.slice(0, 4) === currentYear
          ? title.replace(/\s\d{4}$/u, '')
          : title,
      meetings: [],
    };

    group.meetings.push(meeting);
    groups.set(key, group);
  }

  return [...groups.values()];
};
