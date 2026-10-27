import { useEffect, useLayoutEffect, useRef } from 'react';

export const useEmojiPanel = (open: boolean, close?: () => void, closeOutside = true) => {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);
  useLayoutEffect(() => {
    const closed = wasOpen.current && !open;
    wasOpen.current = open;

    if (!closed) {
      return;
    }

    if (
      document.activeElement === document.body ||
      root.current?.querySelector('[inert]')?.contains(document.activeElement)
    ) {
      trigger.current?.focus({ preventScroll: true });
    }
  }, [open]);
  useEffect(() => {
    if (!open) {
      return;
    }

    const outside = (event: PointerEvent) => {
      if (
        closeOutside &&
        event.target instanceof Node &&
        !root.current?.contains(event.target) &&
        !(event.target instanceof Element && event.target.closest('button'))
      ) {
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
  }, [open, close, closeOutside]);

  return { root, trigger };
};
