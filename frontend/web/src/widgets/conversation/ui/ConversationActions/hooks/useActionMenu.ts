import { useEffect, useLayoutEffect, useRef } from 'react';

export const useActionMenu = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const closed = wasOpen.current && !open;
    wasOpen.current = open;

    if (
      closed &&
      (document.activeElement === document.body ||
        ref.current?.querySelector('[role="menu"]')?.contains(document.activeElement))
    ) {
      ref.current?.querySelector('button')?.focus({ preventScroll: true });
    }
  }, [open]);
  useEffect(() => {
    if (!open) {
      return;
    }

    ref.current
      ?.querySelector<HTMLButtonElement>('[role="menuitem"]')
      ?.focus({ preventScroll: true });
    const outside = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target) &&
        !(event.target instanceof Element && event.target.closest('button'))
      ) {
        close();
      }
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        ref.current?.querySelector('button')?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, close]);

  return ref;
};
