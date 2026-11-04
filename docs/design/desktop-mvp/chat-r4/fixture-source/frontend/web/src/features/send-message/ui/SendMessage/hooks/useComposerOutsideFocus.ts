import { useEffect } from 'react';
import type { RefObject } from 'react';

export const useComposerOutsideFocus = (input: RefObject<HTMLTextAreaElement | null>) => {
  useEffect(() => {
    const dismiss = (event: MouseEvent) => {
      const field = input.current;

      if (
        event.detail === 0 ||
        !field ||
        document.activeElement !== field ||
        !(event.target instanceof Node) ||
        (field.closest('label') ?? field).contains(event.target)
      ) {
        return;
      }

      // Wait for the click to be resolved: hiding the mobile keyboard on
      // pointerdown can move Send or another action before pointerup.
      field.blur();
    };

    document.addEventListener('click', dismiss, true);

    return () => document.removeEventListener('click', dismiss, true);
  }, [input]);
};
