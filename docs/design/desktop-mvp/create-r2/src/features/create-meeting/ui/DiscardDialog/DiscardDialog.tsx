import { Modal } from "@create/shared/ui/Modal";
import styles from "@create/features/create-meeting/ui/DiscardDialog/DiscardDialog.module.css";

export type DiscardDialogProps = {
  open: boolean;
  stay: () => void;
  leave: () => void;
};
export const DiscardDialog = ({ open, stay, leave }: DiscardDialogProps) => (
  <Modal open={open} title="Выйти из формы?" onClose={stay}>
    <p className={styles.copy}>Встреча ещё не создана.</p>
    <div className={styles.actions}>
      <button type="button" className={styles.primary} onClick={stay}>
        Продолжить редактирование
      </button>
      <button type="button" onClick={leave}>
        Выйти
      </button>
    </div>
  </Modal>
);
