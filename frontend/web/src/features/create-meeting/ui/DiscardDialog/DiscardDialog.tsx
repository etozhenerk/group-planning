import styles from '@/features/create-meeting/ui/DiscardDialog/DiscardDialog.module.css';
import { Dialog } from '@/shared/ui/Dialog';

export type DiscardDialogProps = { open: boolean; stay: () => void; leave: () => void };

export const DiscardDialog = ({ open, stay, leave }: DiscardDialogProps) => {
  return (
    <Dialog open={open} title="Выйти из формы?" onClose={stay}>
      <p>Встреча ещё не создана.</p>
      <div className={styles['row']}>
        <button type="button" className={styles['primary']} onClick={stay}>
          Продолжить редактирование
        </button>
        <button type="button" onClick={leave}>
          Выйти
        </button>
      </div>
    </Dialog>
  );
};
