import type { ReactNode } from "react";
import { X } from "lucide-react";
import { useModal } from "@create/shared/ui/Modal/model/useModal";
import styles from "@create/shared/ui/Modal/Modal.module.css";

export type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};
export const Modal = ({ open, title, onClose, children }: ModalProps) => {
  const ref = useModal(open);
  return (
    <dialog
      ref={ref}
      className={styles.modal}
      aria-label={title}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
    >
      <button
        type="button"
        className={styles.close}
        aria-label="Закрыть диалог"
        onClick={onClose}
      >
        <X size={20} strokeWidth={1.7} />
      </button>
      <h2>{title}</h2>
      {children}
    </dialog>
  );
};
