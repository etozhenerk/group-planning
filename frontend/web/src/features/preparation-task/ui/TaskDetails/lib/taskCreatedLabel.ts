import { clockLabel } from '@/shared/lib/time';

export const taskCreatedLabel = (stamp: string, now = new Date()): string => {
  const date = new Date(stamp);
  const day =
    date.toDateString() === now.toDateString()
      ? 'Сегодня'
      : new Intl.DateTimeFormat('ru-RU', {
          day: 'numeric',
          month: 'long',
          ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
        }).format(date);

  return `${day}, ${clockLabel(stamp)}`;
};
