import type { MeetingSummary } from '@/entities/meeting';
import { browserTimezone, timezoneLabel } from '@/shared/lib/time';

export const meetingClock = (meeting: MeetingSummary): string =>
  meeting.startsAt
    ? new Intl.DateTimeFormat('ru-RU', {
        timeZone: meeting.timezone,
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(meeting.startsAt))
    : '';

export const meetingZone = (meeting: MeetingSummary): string =>
  meeting.startsAt && meeting.timezone !== browserTimezone()
    ? timezoneLabel(meeting.timezone)
    : '';
