import type { FeedEntry } from '@/entities/meeting';
import { MessagePendingIndicator } from '@/features/send-message';
import { clockLabel } from '@/shared/lib/time';
import styles from '@/widgets/conversation/ui/FeedMessageMetadata/FeedMessageMetadata.module.css';

export type FeedMessageMetadataProps = { entry: FeedEntry; own: boolean };

export const FeedMessageMetadata = ({ entry, own }: FeedMessageMetadataProps) => (
  <div className={styles.metadata} data-own={own}>
    <strong>{entry.actor.displayName}</strong>
    <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
    {own && (
      <MessagePendingIndicator state={entry.delivery} createdAt={entry.occurredAt} />
    )}
  </div>
);
