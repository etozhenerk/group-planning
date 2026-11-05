import { useRef } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import type { CSSProperties, KeyboardEvent } from 'react';
import { usePopupLabel } from '@/shared/ui/DateButton/hooks/usePopupLabel';

export const useDateButtonControl = (setOpen: (open: boolean) => void) => {
  const mobile = useMobileLayout();
  const popupStyles: CSSProperties = mobile
    ? {
        position: 'fixed',
        top: 'auto',
        bottom: 'max(var(--ds-space-s8), env(safe-area-inset-bottom))',
        left: 'var(--ds-space-s8)',
        right: 'var(--ds-space-s8)',
        width: 'max-content',
        marginInline: 'auto',
        transform: 'none',
        maxWidth: 'calc(100vw - var(--ds-space-s16))',
      }
    : {};

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

  return { button, popupLabel, keyDown, restoreFocus, popupStyles };
};
