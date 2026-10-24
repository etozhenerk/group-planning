import styles from '@/widgets/conversation/ui/FeedRecord/FeedRecord.module.css';
import type { Session } from '@/entities/session';
import { PlacePollCard } from '@/features/place-poll';
import { DatePollCard } from '@/features/date-poll';
import { entryPresentation } from '@/entities/meeting';
import { SystemEvent } from '@/widgets/conversation/ui/SystemEvent';
import type { FeedEntry } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { clockLabel } from '@/shared/lib/time';

export type FeedRecordProps = { entry: FeedEntry; session: Session };

export const FeedRecord = ({ entry, session }: FeedRecordProps) => {
  const presentation = entryPresentation(entry);

  if (presentation === 'system') {
    return <SystemEvent entry={entry} />;
  }

  const own = entry.actor.id === session.user.id;

  return (
    <li
      className={[styles['feed-message'], own ? styles['is-own'] : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="feed-message"
    >
      <Avatar name={entry.actor.displayName} own={own} />
      <div className={styles['message-content']}>
        <div className={styles['message-author']}>
          <strong>{entry.actor.displayName}</strong>
          <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
        </div>
        {entry.placePollId ? (
          <PlacePollCard
            meeting={entry.meetingId}
            id={entry.placePollId}
            session={session}
            outgoing={own}
          />
        ) : entry.pollId ? (
          <DatePollCard
            meeting={entry.meetingId}
            id={entry.pollId}
            session={session}
            outgoing={own}
          />
        ) : (
          <p className={styles['message-bubble']} data-testid="message-bubble">
            {entry.text ?? entry.event}
          </p>
        )}
      </div>
    </li>
  );
};
