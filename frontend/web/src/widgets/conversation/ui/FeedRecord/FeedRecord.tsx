import { FeedRecordActions } from '@/widgets/conversation/ui/FeedRecordActions';
import { FeedMessageContent } from '@/widgets/conversation/ui/FeedMessageContent';
import { useReactionGesture } from '@/widgets/conversation/ui/FeedRecord/hooks/useReactionGesture';
import { useEntrySurface } from '@/widgets/conversation/ui/FeedRecord/hooks/useEntrySurface';
import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';
import type { Reaction } from '@/entities/meeting';
import styles from '@/widgets/conversation/ui/FeedRecord/FeedRecord.module.css';
import type { Session } from '@/entities/session';
import type { FeedEntry } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { FeedMessageMetadata } from '@/widgets/conversation/ui/FeedMessageMetadata';

export type FeedRecordProps = {
  read?:
    | { enabled: boolean; count: string | undefined; version: string | undefined }
    | undefined;
  entry: FeedEntry;
  session: Session;
  reactions: Reaction[];
  surface: ConversationSurface;
};

export const FeedRecord = ({
  entry,
  session,
  reactions,
  surface,
  read,
}: FeedRecordProps) => {
  const panel = useEntrySurface(surface, entry.id);
  const interactive = entry.kind === 'message' && !entry.delivery;
  const gesture = useReactionGesture(interactive, () => panel.change(true));

  const own = entry.actor.id === session.user.id;

  return (
    <li
      className={[
        styles['feed-message'],
        own ? styles['is-own'] : '',
        panel.active ? styles.active : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="feed-message"
      data-mobile={surface.mobile}
      data-ui-key={
        entry.clientRequestId ? `${entry.actor.id}:${entry.clientRequestId}` : entry.id
      }
      data-delivery={entry.delivery ?? 'accepted'}
    >
      <Avatar
        name={entry.actor.displayName}
        own={own}
        size={surface.mobile ? 'mobile-chat' : 'chat'}
      />
      <div className={styles['message-content']}>
        <FeedMessageMetadata entry={entry} own={own} />
        <div
          ref={gesture.anchor}
          className={styles.target}
          data-testid="message-actions"
          data-read-sequence={interactive ? entry.sequence : undefined}
          data-chat-surface-trigger
          data-pressing={gesture.pressed}
          tabIndex={interactive ? 0 : undefined}
          role={interactive ? 'group' : undefined}
          aria-label={
            entry.kind === 'message'
              ? `Реакции на сообщение: ${entry.text ?? 'Вложение'}`
              : undefined
          }
          aria-haspopup={interactive ? 'dialog' : undefined}
          aria-expanded={interactive ? panel.active : undefined}
          aria-keyshortcuts={interactive ? 'Enter Space Shift+F10' : undefined}
          {...gesture.events}
        >
          <FeedMessageContent entry={entry} session={session} own={own}>
            <p className={styles['message-bubble']} data-testid="message-bubble">
              {entry.text ?? entry.event}
            </p>
          </FeedMessageContent>
        </div>
        <FeedRecordActions
          entry={entry}
          session={session}
          reactions={reactions}
          surface={surface}
          panel={panel}
          anchor={gesture.anchor}
          read={read}
        />
      </div>
    </li>
  );
};
