import { dateTimeParse } from '@gravity-ui/date-utils';
import { Temporal } from '@js-temporal/polyfill';

export const calendarValue = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  try {
    Temporal.PlainDate.from(value, { overflow: 'reject' });
  } catch {
    return null;
  }

  return dateTimeParse(`${value}T00:00:00Z`, { timeZone: 'UTC' }) ?? null;
};

export const calendarToday = (timezone: string) => {
  return calendarValue(Temporal.Now.plainDateISO(timezone).toString()) ?? undefined;
};
