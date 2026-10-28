import { useRef } from 'react';
import type { KeyboardEvent } from 'react';
import { usePopupLabel } from '@/shared/ui/DateButton/hooks/usePopupLabel';

export const useDateButtonControl = (setOpen: (open: boolean) => void) => {
  const button = useRef<HTMLButtonElement>(null);
  const popupLabel = usePopupLabel('Выбрать дату');
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.altKey && event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
    }
  };

  const restoreFocus = () => {
    requestAnimationFrame(() => button.current?.focus({ preventScroll: true }));
  };

  return { button, popupLabel, keyDown, restoreFocus };
};
