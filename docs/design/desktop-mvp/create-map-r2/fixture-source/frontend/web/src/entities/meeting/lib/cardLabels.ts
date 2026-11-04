import type { MeetingSummary } from '@/entities/meeting/model/types';
import { browserTimezone, timezoneLabel } from '@/shared/lib/time';

export const cardLabels = (
  meeting: Pick<MeetingSummary, 'startsAt' | 'startsOn' | 'timezone'>,
) => {
  if (!meeting.startsAt && !meeting.startsOn) {
    return { day: '—', weekday: '', zone: '', date: 'Дата ещё не выбрана' };
  }

  const stamp = new Date(meeting.startsAt ?? `${meeting.startsOn}T12:00:00Z`);

  const date = new Intl.DateTimeFormat('ru-RU', {
    timeZone: meeting.startsAt ? meeting.timezone : 'UTC',
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(stamp);

  const time = meeting.startsAt
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: meeting.timezone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(stamp)
    : 'время уточняем';

  return {
    date: `${date.charAt(0).toUpperCase() + date.slice(1)} · ${time}`,
    day: new Intl.DateTimeFormat('ru-RU', {
      timeZone: meeting.startsAt ? meeting.timezone : 'UTC',
      day: 'numeric',
    }).format(stamp),
    weekday: new Intl.DateTimeFormat('ru-RU', {
      timeZone: meeting.startsAt ? meeting.timezone : 'UTC',
      weekday: 'short',
    }).format(stamp),
    zone: meeting.timezone !== browserTimezone() ? timezoneLabel(meeting.timezone) : '',
  };
};
