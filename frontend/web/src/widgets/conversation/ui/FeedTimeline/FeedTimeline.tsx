import styles from '@/widgets/conversation/ui/FeedTimeline/FeedTimeline.module.css';
import type { Session } from '@/entities/session';
import { useConversation } from '@/entities/meeting';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { SendMessage } from '@/features/send-message';
import { useViewport } from '@/widgets/conversation/ui/FeedTimeline/hooks/useViewport';
import { FeedRecord } from '@/widgets/conversation/ui/FeedRecord';

export type FeedTimelineProps = { id: string; session: Session };

export const FeedTimeline = ({ id, session }: FeedTimelineProps) => {
  const query = useConversation(id, session.user.id);
  const viewport = useViewport(query.data?.entries ?? [], query.loadOlder);

  if (query.access.denied) {
    return (
      <Status
        title="Переписка закрыта"
        text="Откройте приглашение, чтобы проверить или изменить ответ."
      />
    );
  }

  if (query.isPending) {
    return <Status title="Загружаем разговор…" />;
  }

  if (!query.data) {
    return (
      <Status
        title="Не удалось загрузить разговор"
        text={errorText(query.error)}
        error
        action={() => void query.refetch()}
      />
    );
  }

  return (
    <>
      <div
        className={styles['feed-scroll']}
        ref={viewport.ref}
        onScroll={viewport.scroll}
      >
        {query.data.hasOlder && (
          <button
            className={styles['history-button']}
            type="button"
            onClick={viewport.older}
            disabled={query.loadingOlder}
          >
            {query.loadingOlder ? 'Загружаем…' : 'Предыдущие записи'}
          </button>
        )}
        {query.historyError ? (
          <p className={styles['error']} role="alert">
            Не удалось загрузить историю. Попробуйте ещё раз.
          </p>
        ) : null}
        <ol className={styles['feed-timeline']} aria-label="Разговор встречи">
          {query.data.entries.map((entry) => (
            <FeedRecord key={entry.id} entry={entry} userId={session.user.id} />
          ))}
        </ol>
        {query.error && (
          <p className={styles['error']} role="status">
            Не удалось обновить разговор. Повторим запрос.
          </p>
        )}
      </div>
      {viewport.unread && (
        <button
          className={styles['new-messages']}
          type="button"
          onClick={viewport.latest}
        >
          Новые сообщения ↓
        </button>
      )}
      <SendMessage id={id} session={session} />
    </>
  );
};
