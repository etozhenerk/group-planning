import type { MeetingSummary } from '@/entities/meeting/model/types';
import { browserTimezone, timezoneLabel } from '@/shared/lib/time';

export const cardLabels = (meeting: MeetingSummary) => {
  if (!meeting.startsAt && !meeting.startsOn) {
    return { day: '—', weekday: '', zone: '' };
  }

  const stamp = new Date(meeting.startsAt ?? `${meeting.startsOn}T12:00:00Z`);

  return {
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
