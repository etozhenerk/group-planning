import type { MeetingSummary } from '@/entities/meeting/model/types';
import { Temporal } from '@js-temporal/polyfill';
import { browserTimezone, timezoneLabel } from '@/shared/lib/time';

export const cardLabels = (
  meeting: Pick<MeetingSummary, 'startsAt' | 'startsOn' | 'timezone'>,
) => {
  if (!meeting.startsAt && !meeting.startsOn) {
    return {
      day: '—',
      weekday: '',
      weekend: false,
      zone: '',
      date: 'Дата ещё не выбрана',
    };
  }

  const stamp = new Date(meeting.startsAt ?? `${meeting.startsOn}T12:00:00Z`);
  const dayOfWeek = meeting.startsAt
    ? Temporal.Instant.from(meeting.startsAt).toZonedDateTimeISO(meeting.timezone)
        .dayOfWeek
    : meeting.startsOn
      ? Temporal.PlainDate.from(meeting.startsOn).dayOfWeek
      : 0;

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
    weekend: dayOfWeek >= 6,
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
