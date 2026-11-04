import type { FeedEntry } from '@/entities/meeting';
import { eventTimestamp } from '@/widgets/conversation/ui/SystemEvent/lib/eventTimestamp';
import styles from '@/widgets/conversation/ui/SystemEvent/SystemEvent.module.css';

export type SystemEventProps = { entry: FeedEntry };

export const SystemEvent = ({ entry }: SystemEventProps) => {
  return (
    <li className={styles['event']} data-testid="system-event">
      <time dateTime={entry.occurredAt}>{eventTimestamp(entry.occurredAt)}</time>
      <p>{entry.event}</p>
    </li>
  );
};
