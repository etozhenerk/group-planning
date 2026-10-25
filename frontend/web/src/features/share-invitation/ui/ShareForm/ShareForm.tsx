import { Share } from 'lucide-react';
import { useShare } from '@/features/share-invitation/model/useShare';
import { Skeleton } from '@/shared/ui/Skeleton';
import { errorText } from '@/shared/api';
import styles from '@/features/share-invitation/ui/ShareForm/ShareForm.module.css';

export type ShareFormProps = { id: string };

export const ShareForm = ({ id }: ShareFormProps) => {
  const action = useShare(id, true);

  return (
    <section className={styles.panel}>
      <p>Отправьте ссылку тем, кого хотите позвать.</p>
      {action.query.isPending && (
        <div role="status" aria-label="Загрузка ссылки" aria-busy="true">
          <Skeleton height={44} />
        </div>
      )}
      {action.query.error && (
        <div role="alert">
          <p>{errorText(action.query.error)}</p>
          <button type="button" onClick={() => void action.query.refetch()}>
            Попробовать снова
          </button>
        </div>
      )}
      {action.query.data && (
        <>
          <label>
            Ссылка приглашения
            <input
              readOnly
              value={action.query.data}
              onFocus={(event) => event.currentTarget.select()}
            />
          </label>
          <button type="button" className={styles.primary} onClick={action.copy}>
            Скопировать ссылку
          </button>
          {action.canShare && (
            <button type="button" className={styles.share} onClick={action.share}>
              <Share size={18} aria-hidden="true" />
              Поделиться
            </button>
          )}
        </>
      )}
      {action.message && (
        <p role="status" className={action.failed ? styles.error : styles.message}>
          {action.message}
        </p>
      )}
    </section>
  );
};
