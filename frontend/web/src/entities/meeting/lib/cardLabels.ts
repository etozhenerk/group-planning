import type { MeetingSummary } from '@/entities/meeting/model/types';
import { browserTimezone, timezoneLabel } from '@/shared/lib/time';

export const cardLabels = (meeting: MeetingSummary) => {
  if (!meeting.startsAt) {
    return { day: '—', weekday: '', zone: '' };
  }

  const stamp = new Date(meeting.startsAt);

  return {
    day: new Intl.DateTimeFormat('ru-RU', {
      timeZone: meeting.timezone,
      day: 'numeric',
    }).format(stamp),
    weekday: new Intl.DateTimeFormat('ru-RU', {
      timeZone: meeting.timezone,
      weekday: 'short',
    }).format(stamp),
    zone: meeting.timezone !== browserTimezone() ? timezoneLabel(meeting.timezone) : '',
  };
};
