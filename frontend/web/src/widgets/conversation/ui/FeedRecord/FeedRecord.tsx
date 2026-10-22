import styles from '@/widgets/conversation/ui/FeedRecord/FeedRecord.module.css';
import type { Session } from '@/entities/session';
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

  const bot = presentation === 'notification';
  const own = !bot && entry.actor.id === session.user.id;

  return (
    <li
      className={[styles['feed-message'], own ? styles['is-own'] : '']
        .filter(Boolean)
        .join(' ')}
      data-testid="feed-message"
    >
      {bot ? (
        <img className={styles['bot-avatar']} src="/somewhere.svg" alt="" />
      ) : (
        <Avatar name={entry.actor.displayName} own={own} />
      )}
      <div className={styles['message-content']}>
        <div className={styles['message-author']}>
          <strong>{bot ? 'Бот' : entry.actor.displayName}</strong>
          <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
        </div>
        {entry.pollId ? (
          <DatePollCard meeting={entry.meetingId} id={entry.pollId} session={session} />
        ) : (
          <p className={styles['message-bubble']} data-testid="message-bubble">
            {entry.text ?? entry.event}
          </p>
        )}
      </div>
    </li>
  );
};
