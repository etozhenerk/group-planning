import { timeLabel } from '@/shared/lib/time';

export const summaryTimeLabel = (
  stamp: string | null,
  timezone: string,
  day?: string | null,
) => {
  if (!stamp) {
    return timeLabel(stamp, timezone, day);
  }

  const value = new Date(stamp);
  const date = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    day: 'numeric',
    month: 'long',
  }).format(value);

  const time = new Intl.DateTimeFormat('ru-RU', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
  }).format(value);

  return `${date} · ${time}`;
};
