import { Dialog } from '@/shared/ui/Dialog';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import styles from '@/features/delete-account/ui/DeletionDialog/DeletionDialog.module.css';

export type DeletionDialogProps = {
  open: boolean;
  busy: boolean;
  pending: boolean;
  needsLogin: boolean;
  error: string | null;
  close: () => void;
  submit: () => void;
  leave: () => void;
};

export const DeletionDialog = ({
  open,
  busy,
  pending,
  needsLogin,
  error,
  close,
  submit,
  leave,
}: DeletionDialogProps) => (
  <Dialog
    open={open}
    title="Удалить аккаунт?"
    onClose={close}
    dismissible={!pending && !busy}
  >
    <div className={styles.content}>
      <p>
        Профиль и доступ к нему будут удалены. Сообщения в общих встречах останутся с
        подписью «Удалённый аккаунт».
      </p>
      <p>
        Организатором станет первый вступивший из оставшихся участников «Приду». Встречи
        без таких участников удалятся.
      </p>
      <p>Отменить удаление после подтверждения не получится.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.actions}>
        {!pending && (
          <button type="button" onClick={close} disabled={busy}>
            Отмена
          </button>
        )}
        {needsLogin ? (
          <button type="button" onClick={leave}>
            Вернуться ко входу
          </button>
        ) : (
          <button
            type="button"
            className={styles.danger}
            onClick={submit}
            disabled={busy}
            aria-busy={busy}
            aria-label={
              busy ? 'Удаление аккаунта' : pending ? 'Повторить' : 'Удалить аккаунт'
            }
          >
            {busy ? <ButtonSpinner /> : pending ? 'Повторить' : 'Удалить аккаунт'}
          </button>
        )}
      </div>
    </div>
  </Dialog>
);
