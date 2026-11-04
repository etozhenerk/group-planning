import { useEffect, useRef } from "react";
import { InfoPanel } from "@desktop/pages/chat/ui/InfoPanel/InfoPanel";
import styles from "@desktop/pages/chat/ui/InfoDialog/InfoDialog.module.css";

export type InfoDialogProps = {
  open: boolean;
  onClose: () => void;
  onShare: () => void;
};

export const InfoDialog = ({ open, onClose, onShare }: InfoDialogProps) => {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (open && !ref.current?.open) ref.current?.showModal();
    if (!open && ref.current?.open) ref.current?.close();
  }, [open]);
  return (
    <dialog
      className={styles.dialog}
      ref={ref}
      aria-label="О встрече"
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <InfoPanel compact onClose={onClose} onShare={onShare} />
    </dialog>
  );
};
