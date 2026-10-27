import { newMessagesLabel } from '@/widgets/conversation/lib/feedKey';
import { InvitePrompt } from '@/widgets/conversation/ui/InvitePrompt';
import { FeedUnavailable } from '@/widgets/conversation/ui/FeedUnavailable';
import styles from '@/widgets/conversation/ui/FeedTimeline/FeedTimeline.module.css';
import type { Session } from '@/entities/session';
import { ConversationComposer } from '@/widgets/conversation/ui/ConversationComposer';
import { useFeedTimeline } from '@/widgets/conversation/ui/FeedTimeline/hooks/useFeedTimeline';
import { FeedRecords } from '@/widgets/conversation/ui/FeedRecords';
import { FeedHistory } from '@/widgets/conversation/ui/FeedHistory';
import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';

export type FeedTimelineProps = {
  id: string;
  session: Session;
  organizer?: boolean;
  surface: ConversationSurface;
};

export const FeedTimeline = ({
  id,
  session,
  organizer = false,
  surface,
}: FeedTimelineProps) => {
  const { query, reactions, viewport, entries, read } = useFeedTimeline(
    id,
    session,
    surface.boundary,
    surface.panel !== null,
  );

  if (query.access.denied || query.isPending || !query.data) {
    return <FeedUnavailable query={query} />;
  }

  return (
    <>
      <div
        className={styles['feed-scroll']}
        ref={viewport.ref}
        onScrollCapture={viewport.scroll}
        data-mobile={surface.mobile}
        data-history={viewport.unread}
        data-server-count={query.data.entries.length}
        data-has-older={query.data.hasOlder}
        data-window-first={query.data.entries[0]?.sequence}
        data-window-last={query.data.entries.at(-1)?.sequence}
      >
        <FeedHistory
          hasOlder={query.data.hasOlder}
          loading={query.loadingOlder}
          error={!!query.historyError}
          older={() => void viewport.older()}
        />
        <FeedRecords
          read={read}
          error={!!reactions.error}
          retry={() => void reactions.refetch()}
          entries={entries}
          viewport={viewport}
          session={session}
          reactions={reactions.data ?? []}
          surface={surface}
        />
        {organizer &&
          query.data.participantCount === 1 &&
          !query.data.entries.some((entry) => entry.kind === 'message') && (
            <InvitePrompt id={id} />
          )}
        <FeedHistory
          hasOlder={!!query.data.window?.hasNewer}
          loading={query.loadingNewer}
          error={!!query.newerError}
          older={() => void query.loadNewer()}
          newer
        />
        {query.error && (
          <p className={styles['error']} role="status">
            Не удалось обновить разговор. Повторим запрос.
          </p>
        )}
      </div>
      {viewport.unread && (
        <div className={styles['new-messages-position']}>
          <button
            className={styles['new-messages']}
            type="button"
            onClick={viewport.latest}
          >
            {newMessagesLabel(query.data.newMessages ?? 0)}
          </button>
        </div>
      )}
      <ConversationComposer id={id} session={session} surface={surface} />
    </>
  );
};
