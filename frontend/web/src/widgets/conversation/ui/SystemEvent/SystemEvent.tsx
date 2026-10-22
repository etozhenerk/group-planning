import type { FeedEntry } from '@/entities/meeting';
import { clockLabel } from '@/shared/lib/time';
import styles from '@/widgets/conversation/ui/SystemEvent/SystemEvent.module.css';

export type SystemEventProps = { entry: FeedEntry };

export const SystemEvent = ({ entry }: SystemEventProps) => {
  return (
    <li className={styles['event']} data-testid="system-event">
      <p>{entry.event}</p>
      <time dateTime={entry.occurredAt}>{clockLabel(entry.occurredAt)}</time>
    </li>
  );
};
