import { useEffect, useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { addDays, changeMonth } from '@/pages/meetings/lib/calendarDates';

export const useCalendarKeyboard = (day: string, onSelect: (value: string) => void) => {
  const focusPending = useRef(false);
  const grid = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (focusPending.current) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-day="${day}"]`)?.focus();
      focusPending.current = false;
    }
  }, [day]);
  const selectAndFocus = (value: string) => {
    if (value === day) {
      grid.current?.querySelector<HTMLButtonElement>(`[data-day="${value}"]`)?.focus();
    } else {
      focusPending.current = true;
    }

    onSelect(value);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const offsets: Record<string, number> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
    };

    let next: string | undefined;

    if (offsets[event.key] !== undefined) {
      next = addDays(day, offsets[event.key]!);
    } else if (event.key === 'PageUp' || event.key === 'PageDown') {
      next = changeMonth(day, event.key === 'PageUp' ? -1 : 1);
    }

    if (next) {
      event.preventDefault();
      selectAndFocus(next);
    }
  };

  return { grid, onKeyDown, selectAndFocus };
};
