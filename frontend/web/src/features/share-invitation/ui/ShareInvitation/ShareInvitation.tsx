import { Skeleton } from '@/shared/ui/Skeleton';
import styles from '@/features/share-invitation/ui/ShareInvitation/ShareInvitation.module.css';
import { Share } from 'lucide-react';
import { Dialog } from '@/shared/ui/Dialog';
import { errorText } from '@/shared/api';
import { useShare } from '@/features/share-invitation/model/useShare';

export type ShareInvitationProps = { id: string; compact?: boolean };

export const ShareInvitation = ({ id, compact = false }: ShareInvitationProps) => {
  const action = useShare(id);

  return (
    <>
      <button
        type="button"
        className={[styles['share-invitation-trigger'], compact ? styles['compact'] : '']
          .filter(Boolean)
          .join(' ')}
        onClick={action.show}
        aria-label="Пригласить друзей"
      >
        <Share aria-hidden="true" size={20} />
        <span className={styles['trigger-label']}>Пригласить друзей</span>
      </button>
      <Dialog open={action.open} title="Приглашение для друзей" onClose={action.close}>
        <div className={styles['stack']}>
          <p className={styles['muted']}>
            По ссылке видны детали и описание встречи. Переписка откроется после ответа
            «Приду».
          </p>
          {action.query.isPending && (
            <div
              role="status"
              aria-label="Загрузка ссылки"
              aria-busy="true"
              className={styles.stack}
            >
              <Skeleton height={44} />
              <Skeleton width={190} height={44} />
            </div>
          )}
          {action.query.error && (
            <p role="alert" className={styles['error']}>
              {errorText(action.query.error)}
            </p>
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
              <div className={styles['row']}>
                <button type="button" className={styles['primary']} onClick={action.copy}>
                  Скопировать ссылку
                </button>
                {action.canShare && (
                  <button type="button" onClick={action.share}>
                    <Share size={18} aria-hidden="true" />
                    Поделиться
                  </button>
                )}
              </div>
            </>
          )}
          <p role="status" className={action.failed ? styles['error'] : styles['muted']}>
            {action.message}
          </p>
        </div>
      </Dialog>
    </>
  );
};
