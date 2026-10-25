import { InvitePrompt } from '@/widgets/conversation/ui/InvitePrompt';
import { SkeletonConversation } from '@/shared/ui/SkeletonConversation';
import styles from '@/widgets/conversation/ui/FeedTimeline/FeedTimeline.module.css';
import type { Session } from '@/entities/session';
import { useConversation, useReactions } from '@/entities/meeting';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { ConversationComposer } from '@/widgets/conversation/ui/ConversationComposer';
import { useViewport } from '@/widgets/conversation/ui/FeedTimeline/hooks/useViewport';
import { FeedRecords } from '@/widgets/conversation/ui/FeedRecords';

export type FeedTimelineProps = { id: string; session: Session; organizer?: boolean };

export const FeedTimeline = ({ id, session, organizer = false }: FeedTimelineProps) => {
  const query = useConversation(id, session.user.id);
  const reactions = useReactions(
    id,
    session.user.id,
    query.data?.entries
      .filter((entry) => entry.kind === 'message')
      .map((entry) => entry.id) ?? [],
  );

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
    return <SkeletonConversation />;
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
        <FeedRecords
          error={!!reactions.error}
          retry={() => void reactions.refetch()}
          entries={query.data.entries}
          session={session}
          reactions={reactions.data ?? []}
        />
        {organizer &&
          query.data.participantCount === 1 &&
          !query.data.entries.some((entry) => entry.kind === 'message') && (
            <InvitePrompt id={id} />
          )}
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
      <ConversationComposer id={id} session={session} />
    </>
  );
};
