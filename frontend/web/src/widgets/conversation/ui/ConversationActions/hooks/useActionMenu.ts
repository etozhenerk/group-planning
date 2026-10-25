import { useEffect, useRef } from 'react';

export const useActionMenu = (open: boolean, close: () => void) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) {
      return;
    }

    ref.current?.querySelector<HTMLButtonElement>('[role="menuitem"]')?.focus();
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !ref.current?.contains(event.target)) {
        close();
      }
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
        ref.current?.querySelector('button')?.focus();
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
