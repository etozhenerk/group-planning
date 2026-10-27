import { useId, useLayoutEffect, useRef, useState } from 'react';

export const useParticipantExpansion = () => {
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const toggle = useRef<HTMLButtonElement>(null);
  const collapse = useRef<HTMLButtonElement>(null);
  const focusRequested = useRef(false);

  useLayoutEffect(() => {
    if (focusRequested.current) {
      const target = (expanded ? collapse : toggle).current;
      target?.focus({ preventScroll: true });
      let viewport = target?.parentElement;

      while (
        viewport &&
        !['auto', 'scroll'].includes(getComputedStyle(viewport).overflowY)
      ) {
        viewport = viewport.parentElement;
      }

      if (target && viewport) {
        const control = target.getBoundingClientRect();
        const bounds = viewport.getBoundingClientRect();

        if (control.bottom > bounds.bottom) {
          viewport.scrollTop += control.bottom - bounds.bottom;
        } else if (control.top < bounds.top) {
          viewport.scrollTop -= bounds.top - control.top;
        }
      }

      focusRequested.current = false;
    }
  }, [expanded]);

  const change = (next: boolean) => {
    focusRequested.current = true;
    setExpanded(next);
  };

  return { expanded, id, toggle, collapse, change };
};
