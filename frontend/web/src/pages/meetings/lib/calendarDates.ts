import { Temporal } from '@js-temporal/polyfill';

export const today = (): string => Temporal.Now.plainDateISO().toString();

export { validDay } from '@/shared/lib/time';

export const addDays = (day: string, days: number): string =>
  Temporal.PlainDate.from(day).add({ days }).toString();

export const changeMonth = (day: string, months: number): string =>
  Temporal.PlainDate.from(day).add({ months }).toString();

export const monthRange = (day: string) => {
  const first = Temporal.PlainDate.from(day).with({ day: 1 });
  const from = first.subtract({ days: first.dayOfWeek - 1 }).toString();

  return { from, to: addDays(from, 42) };
};

export const monthDays = (day: string): string[] => {
  const { from } = monthRange(day);

  return Array.from({ length: 42 }, (_, index) => addDays(from, index));
};

export const monthLabel = (day: string): string =>
  Temporal.PlainDate.from(day)
    .toLocaleString('ru-RU', { month: 'long', year: 'numeric' })
    .replace(' г.', '');

export const dayLabel = (day: string): string =>
  Temporal.PlainDate.from(day).toLocaleString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

export const agendaLabel = (day: string): string => {
  const label = Temporal.PlainDate.from(day).toLocaleString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const meetingCountLabel = (count: number): string => {
  const form = new Intl.PluralRules('ru-RU').select(count);

  return `${count} ${form === 'one' ? 'встреча' : form === 'few' ? 'встречи' : 'встреч'}`;
};
