import { useEffect, useRef } from 'react';

export const useActionScreen = (open: boolean, close: () => void) => {
  const heading = useRef<HTMLHeadingElement>(null);
  const previous = useRef(false);
  useEffect(() => {
    if (open) {
      heading.current?.focus({ preventScroll: true });
    } else if (previous.current) {
      document
        .querySelector<HTMLButtonElement>('[aria-label="Добавить к встрече"]')
        ?.focus({ preventScroll: true });
    }

    previous.current = open;
  }, [open]);
  useEffect(() => {
    if (!open) {
      return;
    }

    const escape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        !document.querySelector('.g-popup_open, dialog[open]')
      ) {
        event.preventDefault();
        close();
      }
    };

    window.addEventListener('keydown', escape);

    return () => window.removeEventListener('keydown', escape);
  }, [open, close]);

  return heading;
};
