import type { FeedEntry } from '@/entities/meeting';
import { MessagePendingIndicator } from '@/features/send-message';
import { ReadReceipt } from '@/widgets/conversation/ui/ReadReceipt';
import { clockLabel } from '@/shared/lib/time';
import styles from '@/widgets/conversation/ui/FeedMessageMetadata/FeedMessageMetadata.module.css';

export type FeedMessageMetadataProps = {
  entry: FeedEntry;
  own: boolean;
  mobile: boolean;
  count: string | undefined;
  show: () => void;
};

export const FeedMessageMetadata = ({
  entry,
  own,
  mobile,
  count,
  show,
}: FeedMessageMetadataProps) => (
  <div className={styles.metadata} data-own={own} data-mobile={mobile}>
    {!mobile && <strong>{entry.actor.displayName}</strong>}
    <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
    {own &&
      (mobile ? (
        <span className={styles.delivery}>
          <span className={styles.pending}>
            <MessagePendingIndicator
              state={entry.delivery}
              createdAt={entry.occurredAt}
            />
          </span>
          {!entry.delivery && <ReadReceipt mobile count={count} open={show} />}
        </span>
      ) : (
        <MessagePendingIndicator state={entry.delivery} createdAt={entry.occurredAt} />
      ))}
  </div>
);
