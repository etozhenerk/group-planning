import type { DateTime } from '@gravity-ui/date-utils';
import { dayLabel } from '@/shared/lib/time';

export const dateButtonLabel = (value: DateTime | null, mobileSheet: boolean) => {
  if (!value) {
    return mobileSheet ? 'Выбрать дату' : 'ДД.ММ.ГГГГ';
  }

  return mobileSheet ? dayLabel(value.format('YYYY-MM-DD')) : value.format('DD.MM.YYYY');
};
