import { Dialog } from '@/shared/ui/dialog';

export type DiscardDialogProps = { open: boolean; stay: () => void; leave: () => void };

export const DiscardDialog = ({ open, stay, leave }: DiscardDialogProps) => {
  return (
    <Dialog open={open} title="Выйти из формы?" onClose={stay}>
      <p>Встреча ещё не создана.</p>
      <div className="row">
        <button type="button" className="primary" onClick={stay}>
          Продолжить редактирование
        </button>
        <button type="button" onClick={leave}>
          Выйти
        </button>
      </div>
    </Dialog>
  );
};
