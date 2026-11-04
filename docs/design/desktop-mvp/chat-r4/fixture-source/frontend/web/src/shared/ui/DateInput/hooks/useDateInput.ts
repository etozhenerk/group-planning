import { useEffect, useId, useState } from 'react';
import type { MouseEvent } from 'react';
import type { DateTime } from '@gravity-ui/date-utils';
import { calendarToday, calendarValue } from '@/shared/ui/DateInput/lib/calendarValue';

export const useDateInput = (
  value: string,
  timezone: string,
  onChange: (value: string) => void,
  disabled: boolean,
) => {
  const id = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      return;
    }

    const control = document.getElementById(id);
    const hide = () => {
      const dialog = control?.closest('dialog');

      if (control?.closest('[hidden]') || (dialog && !dialog.open)) {
        setOpen(false);
      }
    };

    const observer = new MutationObserver(hide);
    let ancestor = control?.parentElement;

    while (ancestor) {
      observer.observe(ancestor, {
        attributes: true,
        attributeFilter: ['hidden', 'open'],
      });
      ancestor = ancestor.parentElement;
    }

    hide();

    return () => observer.disconnect();
  }, [id, open]);

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
