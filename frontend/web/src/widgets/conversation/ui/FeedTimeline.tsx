import type { Meeting } from '@/entities/meeting';
import { MeetingHero } from '@/widgets/conversation/ui/MeetingHero';
import type { Session } from '@/entities/session';
import { useConversation } from '@/entities/meeting';
import { Status } from '@/shared/ui/status';
import { errorText } from '@/shared/api';
import { SendMessage } from '@/features/send-message';
import { useViewport } from '@/widgets/conversation/model/useViewport';
import { FeedRecord } from '@/widgets/conversation/ui/FeedRecord';

export type FeedTimelineProps = { id: string; session: Session; meeting: Meeting };

export const FeedTimeline = ({ id, session, meeting }: FeedTimelineProps) => {
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
      <div className="feed-scroll" ref={viewport.ref} onScroll={viewport.scroll}>
        <MeetingHero meeting={meeting} />
        {query.data.hasOlder && (
          <button
            className="history-button"
            type="button"
            onClick={viewport.older}
            disabled={query.loadingOlder}
          >
            {query.loadingOlder ? 'Загружаем…' : 'Предыдущие записи'}
          </button>
        )}
        {query.historyError ? (
          <p className="error" role="alert">
            Не удалось загрузить историю. Попробуйте ещё раз.
          </p>
        ) : null}
        <ol className="feed-timeline" aria-label="Разговор встречи">
          {query.data.entries.map((entry) => (
            <FeedRecord key={entry.id} entry={entry} userId={session.user.id} />
          ))}
        </ol>
        {query.error && (
          <p className="error" role="status">
            Не удалось обновить разговор. Повторим запрос.
          </p>
        )}
      </div>
      {viewport.unread && (
        <button className="new-messages" type="button" onClick={viewport.latest}>
          Новые сообщения ↓
        </button>
      )}
      <SendMessage id={id} session={session} />
    </>
  );
};
