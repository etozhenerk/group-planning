import { useEffect, useRef } from "react";

export const useModal = (open: boolean, initialSelector = "") => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal();
      if (initialSelector) {
        ref.current
          ?.querySelector<HTMLElement>(initialSelector)
          ?.focus({ preventScroll: true });
      }
    }
    if (!open && ref.current?.open) {
      ref.current.close();
    }
  }, [open, initialSelector]);
  return ref;
};
