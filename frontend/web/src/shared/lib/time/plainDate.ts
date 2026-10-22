import { Temporal } from '@js-temporal/polyfill';

export const validDay = (value: string | null): string | null => {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  try {
    return Temporal.PlainDate.from(value, { overflow: 'reject' }).toString();
  } catch {
    return null;
  }
};

export const dayLabel = (day: string, weekday = false): string => {
  return Temporal.PlainDate.from(day).toLocaleString(
    'ru-RU',
    weekday ? { weekday: 'long' } : { day: 'numeric', month: 'long' },
  );
};
