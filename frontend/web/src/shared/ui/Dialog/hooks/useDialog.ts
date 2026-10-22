import { useEffect, useRef } from 'react';
import { lockBackgroundScroll } from '@/shared/ui/Dialog/lib/lockBackgroundScroll';

export const useDialog = (open: boolean) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;

    if (!open || !dialog) {
      return;
    }

    const previous = document.activeElement;
    dialog.showModal();
    const unlock = lockBackgroundScroll(dialog);

    return () => {
      dialog.close();
      unlock();

      if (previous instanceof HTMLElement && previous.isConnected) {
        previous.focus({ preventScroll: true });
      }
    };
  }, [open]);

  return ref;
};
