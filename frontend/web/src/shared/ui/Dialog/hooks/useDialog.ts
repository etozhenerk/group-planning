import { useEffect, useRef } from 'react';

export const useDialog = (open: boolean) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;

    if (!open || !dialog) {
      return;
    }

    const previous = document.activeElement;
    dialog.showModal();

    return () => {
      dialog.close();

      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus();
      }
    };
  }, [open]);

  return ref;
};
