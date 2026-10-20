import styles from '@/widgets/conversation/ui/FeedRecord/FeedRecord.module.css';
import type { FeedEntry } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { clockLabel } from '@/shared/lib/time';

export type FeedRecordProps = { entry: FeedEntry; userId: string };

export const FeedRecord = ({ entry, userId }: FeedRecordProps) => {
  if (entry.text === null) {
    return (
      <li className={styles['system-event']}>
        <p>{entry.event}</p>
        <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
      </li>
    );
  }

  return (
    <li
      className={[
        styles['feed-message'],
        entry.actor.id === userId ? styles['is-own'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="feed-message"
    >
      <Avatar name={entry.actor.displayName} own={entry.actor.id === userId} />
      <div className={styles['message-content']}>
        <div className={styles['message-author']}>
          <strong>{entry.actor.displayName}</strong>
          <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
        </div>
        <p className={styles['message-bubble']} data-testid="message-bubble">
          {entry.text}
        </p>
      </div>
    </li>
  );
};
