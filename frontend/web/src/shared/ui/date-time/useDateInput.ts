import { useId, useState } from 'react';
import type { MouseEvent } from 'react';
import type { DateTime } from '@gravity-ui/date-utils';
import { calendarToday, calendarValue } from '@/shared/ui/date-time/calendarValue';

export const useDateInput = (
  value: string,
  timezone: string,
  onChange: (value: string) => void,
  disabled: boolean,
) => {
  const id = useId();
  const [open, setOpen] = useState(false);

  const openFromField = (event: MouseEvent<HTMLDivElement>) => {
    const target = event.target;

    if (
      !disabled &&
      target instanceof Element &&
      target.closest('.g-date-date-picker__field') &&
      !target.closest('button')
    ) {
      setOpen(true);
    }
  };

  const change = (next: DateTime | null) => {
    onChange(next?.format('YYYY-MM-DD') ?? '');
  };

  return {
    id,
    value: calendarValue(value),
    today: calendarToday(timezone),
    change,
    open,
    setOpen,
    openFromField,
  };
};
