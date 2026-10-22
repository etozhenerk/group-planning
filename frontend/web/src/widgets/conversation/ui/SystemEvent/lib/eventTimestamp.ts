import { clockLabel } from '@/shared/lib/time';

export const eventTimestamp = (stamp: string, now = new Date()): string => {
  const date = new Date(stamp);
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const label =
    date.toDateString() === now.toDateString()
      ? 'Сегодня'
      : date.toDateString() === yesterday.toDateString()
        ? 'Вчера'
        : new Intl.DateTimeFormat('ru-RU', {
            day: 'numeric',
            month: 'long',
          }).format(date);

  return `${label} · ${clockLabel(stamp)}`;
};
