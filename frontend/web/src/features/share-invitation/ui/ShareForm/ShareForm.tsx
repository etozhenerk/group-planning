import { ChatIcon } from '@/shared/ui/ChatIcon';
import type { Meeting } from '@/entities/meeting';
import { useMobileLayout } from '@/shared/lib/media';
import { timeLabel } from '@/shared/lib/time';
import { useShare } from '@/features/share-invitation/model/useShare';
import { Skeleton } from '@/shared/ui/Skeleton';
import { errorText } from '@/shared/api';
import styles from '@/features/share-invitation/ui/ShareForm/ShareForm.module.css';

export type ShareFormProps = { id: string; meeting?: Meeting };

export const ShareForm = ({ id, meeting }: ShareFormProps) => {
  const mobile = useMobileLayout();
  const action = useShare(id, true);

  return (
    <section className={styles.panel} data-mobile={mobile}>
      <p>Отправьте ссылку тем, кого хотите позвать.</p>
      {mobile && meeting && (
        <div className={styles.preview}>
          <ChatIcon name="calendar" aria-hidden="true" />
          <div>
            <strong>{meeting.title}</strong>
            <span>
              {timeLabel(meeting.startsAt, meeting.timezone, meeting.startsOn)} ·{' '}
              {meeting.place || 'Место пока не выбрано'}
            </span>
          </div>
        </div>
      )}
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
              <ChatIcon name="share" size={18} aria-hidden="true" />
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
