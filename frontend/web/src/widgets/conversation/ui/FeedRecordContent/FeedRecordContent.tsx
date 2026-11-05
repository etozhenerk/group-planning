import { MessageActionTarget } from '@/widgets/conversation/ui/MessageActionTarget';
import type { FeedRecordProps } from '@/widgets/conversation/ui/FeedRecord/FeedRecord';
import type { useEntrySurface } from '@/widgets/conversation/ui/FeedRecord/hooks/useEntrySurface';
import type { useReactionGesture } from '@/widgets/conversation/ui/FeedRecord/hooks/useReactionGesture';
import { FeedMessageMetadata } from '@/widgets/conversation/ui/FeedMessageMetadata';
import { FeedMessageContent } from '@/widgets/conversation/ui/FeedMessageContent';
import { FeedRecordActions } from '@/widgets/conversation/ui/FeedRecordActions';
import { MessageBubble } from '@/widgets/conversation/ui/MessageBubble';
import { MessageDelivery } from '@/features/send-message';
import styles from '@/widgets/conversation/ui/FeedRecordContent/FeedRecordContent.module.css';

export type FeedRecordContentProps = FeedRecordProps & {
  own: boolean;
  panel: ReturnType<typeof useEntrySurface>;
  gesture: ReturnType<typeof useReactionGesture>;
};

export const FeedRecordContent = ({
  entry,
  session,
  reactions,
  surface,
  read,
  own,
  panel,
  gesture,
}: FeedRecordContentProps) => {
  const simple = !entry.pollId && !entry.attachments?.length;
  const actions = (
    <FeedRecordActions
      entry={entry}
      session={session}
      reactions={reactions}
      surface={surface}
      panel={panel}
      anchor={gesture.anchor}
      read={read}
    />
  );

  const metadata = (
    <FeedMessageMetadata
      entry={entry}
      own={own}
      mobile={surface.mobile}
      count={read?.count}
      show={() => panel.change(true)}
    />
  );

  return (
    <div className={styles.content} data-mobile={surface.mobile} data-own={own}>
      {!surface.mobile && metadata}
      <MessageActionTarget entry={entry} open={panel.active} gesture={gesture}>
        <FeedMessageContent entry={entry} session={session} own={own}>
          <MessageBubble
            entry={entry}
            own={own}
            mobile={surface.mobile}
            footer={
              surface.mobile ? (
                <>
                  {actions}
                  {metadata}
                </>
              ) : null
            }
          />
        </FeedMessageContent>
      </MessageActionTarget>
      {surface.mobile && !simple && (
        <div className={styles.attachmentMeta}>
          {!own && <span>{entry.actor.displayName}</span>}
          {metadata}
        </div>
      )}
      {(!surface.mobile || !simple) && actions}
      {surface.mobile &&
        (entry.delivery === 'rejected' || entry.delivery === 'uncertain') &&
        entry.clientRequestId && (
          <MessageDelivery
            user={session.user.id}
            meeting={entry.meetingId}
            id={entry.clientRequestId}
            state={entry.delivery}
            panel={{ open: panel.active, change: panel.change }}
          />
        )}
    </div>
  );
};
