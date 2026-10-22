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
