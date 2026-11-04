import { useEffect, useRef } from "react";

export const useModal = (open: boolean) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) {
      ref.current?.showModal();
    }
    if (!open && ref.current?.open) {
      ref.current.close();
    }
  }, [open]);
  return ref;
};
