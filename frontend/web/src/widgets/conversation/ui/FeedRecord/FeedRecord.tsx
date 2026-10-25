import { Attachment } from '@/features/view-media';
import { useState } from 'react';
import { MessageReactions } from '@/features/message-reactions';
import type { Reaction } from '@/entities/meeting';
import styles from '@/widgets/conversation/ui/FeedRecord/FeedRecord.module.css';
import type { Session } from '@/entities/session';
import { TaskRecord } from '@/widgets/conversation/ui/TaskRecord';
import { PlacePollCard } from '@/features/place-poll';
import { DatePollCard } from '@/features/date-poll';
import { entryPresentation } from '@/entities/meeting';
import { SystemEvent } from '@/widgets/conversation/ui/SystemEvent';
import type { FeedEntry } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { clockLabel } from '@/shared/lib/time';

export type FeedRecordProps = {
  entry: FeedEntry;
  session: Session;
  reactions: Reaction[];
};

export const FeedRecord = ({ entry, session, reactions }: FeedRecordProps) => {
  const [active, setActive] = useState(false);
  const presentation = entryPresentation(entry);

  if (presentation === 'system') {
    return <SystemEvent entry={entry} />;
  }

  if (entry.taskId) {
    return <TaskRecord entry={entry} id={entry.taskId} session={session} />;
  }

  const own = entry.actor.id === session.user.id;

  return (
    <li
      className={[
        styles['feed-message'],
        own ? styles['is-own'] : '',
        active ? styles.active : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="feed-message"
      onPointerDown={() => setActive(true)}
      onPointerLeave={() => setActive(false)}
    >
      <Avatar name={entry.actor.displayName} own={own} size="chat" />
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
        ) : entry.attachments?.length ? (
          <>
            {entry.attachments.map((media) => (
              <Attachment key={media.id} media={media} user={session.user.id} />
            ))}
            {entry.text &&
              entry.attachments.some(
                (media) => media.kind === 'file' && media.file_name !== entry.text,
              ) && (
                <p className={styles['message-bubble']} data-testid="message-bubble">
                  {entry.text}
                </p>
              )}
          </>
        ) : (
          <p className={styles['message-bubble']} data-testid="message-bubble">
            {entry.text ?? entry.event}
          </p>
        )}
        {entry.kind === 'message' && (
          <MessageReactions
            id={entry.meetingId}
            entry={entry.id}
            session={session}
            reactions={reactions}
          />
        )}
      </div>
    </li>
  );
};
