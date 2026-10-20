import type { FeedEntry } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/avatar';
import { clockLabel } from '@/shared/lib/time';

export type FeedRecordProps = { entry: FeedEntry; userId: string };

export const FeedRecord = ({ entry, userId }: FeedRecordProps) => {
  if (entry.text === null) {
    return (
      <li className="system-event">
        <p>{entry.event}</p>
        <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
      </li>
    );
  }

  return (
    <li className={`feed-message ${entry.actor.id === userId ? 'is-own' : ''}`}>
      <Avatar name={entry.actor.displayName} own={entry.actor.id === userId} />
      <div className="message-content">
        <div className="message-author">
          <strong>{entry.actor.displayName}</strong>
          <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
        </div>
        <p className="message-bubble">{entry.text}</p>
      </div>
    </li>
  );
};
