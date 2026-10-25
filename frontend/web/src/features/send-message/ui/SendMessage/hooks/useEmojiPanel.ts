import { useEffect, useRef } from 'react';

export const useEmojiPanel = (open: boolean, close?: () => void) => {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) {
      return;
    }

    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !root.current?.contains(event.target)) {
        close?.();
      }
    };

    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close?.();
        trigger.current?.focus({ preventScroll: true });
      }
    };

    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);

    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [open, close]);

  return { root, trigger };
};
