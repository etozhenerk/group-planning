import { Fragment } from 'react';
import { eventTimestamp } from '@/widgets/conversation/ui/SystemEvent/lib/eventTimestamp';
import type { FeedEntry, Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { FeedRecord } from '@/widgets/conversation/ui/FeedRecord';
import styles from '@/widgets/conversation/ui/FeedRecords/FeedRecords.module.css';

export type FeedRecordsProps = {
  error?: boolean;
  retry?: () => void;
  entries: FeedEntry[];
  session: Session;
  reactions: { entry_id: string; reactions: Reaction[] }[];
};

export const FeedRecords = ({
  entries,
  session,
  reactions,
  error = false,
  retry,
}: FeedRecordsProps) => (
  <>
    <ol className={styles.timeline} aria-label="Разговор встречи">
      {entries.map((entry, index) => (
        <Fragment key={entry.id}>
          {entry.kind === 'message' &&
            (index === 0 ||
              new Date(entries[index - 1]?.occurredAt ?? '').toDateString() !==
                new Date(entry.occurredAt).toDateString()) && (
              <li className={styles.day}>
                {eventTimestamp(entry.occurredAt).split(' · ')[0]}
              </li>
            )}
          <FeedRecord
            entry={entry}
            session={session}
            reactions={
              reactions.find((value) => value.entry_id === entry.id)?.reactions ?? []
            }
          />
        </Fragment>
      ))}
    </ol>
    {error && (
      <p role="status">
        Не удалось обновить реакции.{' '}
        <button type="button" onClick={retry}>
          Повторить
        </button>
      </p>
    )}
  </>
);
