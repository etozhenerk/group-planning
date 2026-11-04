import type { FeedEntry } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { TaskCard } from '@/features/preparation-task';
import styles from '@/widgets/conversation/ui/TaskRecord/TaskRecord.module.css';

export type TaskRecordProps = { entry: FeedEntry; id: string; session: Session };

export const TaskRecord = ({ entry, id, session }: TaskRecordProps) => (
  <li className={styles.record} data-testid="feed-message">
    <TaskCard
      meeting={entry.meetingId}
      id={id}
      session={session}
      occurredAt={entry.occurredAt}
    />
  </li>
);
