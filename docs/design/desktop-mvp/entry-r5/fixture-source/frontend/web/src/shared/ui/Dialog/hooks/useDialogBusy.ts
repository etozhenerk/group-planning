import { useLayoutEffect, useState } from 'react';
import type { RefObject } from 'react';

export const dialogHasBusyAction = (dialog: HTMLDialogElement | null) =>
  !!dialog &&
  [...dialog.querySelectorAll('button[aria-busy="true"], input[aria-busy="true"]')].some(
    (element) => !element.closest('[hidden]'),
  );

export const useDialogBusy = (
  ref: RefObject<HTMLDialogElement | null>,
  open: boolean,
) => {
  const [busy, setBusy] = useState(false);
  useLayoutEffect(() => {
    const dialog = ref.current;

    if (!dialog || !open) {
      return;
    }

    const update = () => setBusy(dialogHasBusyAction(dialog));
    const observer = new MutationObserver(update);
    observer.observe(dialog, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['aria-busy', 'hidden'],
    });
    update();

    return () => observer.disconnect();
  }, [ref, open]);

  return open && busy;
};
