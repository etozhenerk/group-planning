import type { DateTime } from '@gravity-ui/date-utils';
import { dayLabel } from '@/shared/lib/time';
import { Temporal } from '@js-temporal/polyfill';

export const dateButtonLabel = (
  value: DateTime | null,
  mobileSheet: boolean,
  weekday: boolean,
) => {
  if (!value) {
    return mobileSheet ? 'Выбрать дату' : 'ДД.ММ.ГГГГ';
  }

  if (!mobileSheet) {
    return value.format('DD.MM.YYYY');
  }

  const date = value.format('YYYY-MM-DD');

  return weekday
    ? Temporal.PlainDate.from(date).toLocaleString('ru-RU', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
      })
    : dayLabel(date);
};
