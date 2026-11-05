import { FeedRecordContent } from '@/widgets/conversation/ui/FeedRecordContent';
import { useReactionGesture } from '@/widgets/conversation/ui/FeedRecord/hooks/useReactionGesture';
import { useEntrySurface } from '@/widgets/conversation/ui/FeedRecord/hooks/useEntrySurface';
import type { ConversationSurface } from '@/widgets/conversation/model/useConversationSurface';
import type { Reaction } from '@/entities/meeting';
import styles from '@/widgets/conversation/ui/FeedRecord/FeedRecord.module.css';
import type { Session } from '@/entities/session';
import type { FeedEntry } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';

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
        mobileSrc={entry.actor.avatarUrl ?? (own ? session.user.avatarUrl : null) ?? null}
        own={own}
        size={surface.mobile ? 'mobile-chat' : 'chat'}
      />
      <FeedRecordContent
        entry={entry}
        session={session}
        reactions={reactions}
        surface={surface}
        read={read}
        own={own}
        panel={panel}
        gesture={gesture}
      />
    </li>
  );
};
