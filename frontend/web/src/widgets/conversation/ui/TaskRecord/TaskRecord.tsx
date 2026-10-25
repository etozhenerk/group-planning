import type { FeedEntry } from '@/entities/meeting';
import { usePreparationTask } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { TaskCard } from '@/features/preparation-task';
import { Avatar } from '@/shared/ui/Avatar';
import styles from '@/widgets/conversation/ui/TaskRecord/TaskRecord.module.css';

export type TaskRecordProps = { entry: FeedEntry; id: string; session: Session };

export const TaskRecord = ({ entry, id, session }: TaskRecordProps) => {
  const query = usePreparationTask(entry.meetingId, id, session.user.id);
  const person = query.data?.assignee ?? query.data?.recipient ?? entry.actor;

  return (
    <>
      <li className={styles.system}>Новая задача · {entry.actor.displayName}</li>
      <li className={styles.message} data-testid="feed-message">
        <Avatar name={person.displayName} size="chat" tone="mint" />
        <TaskCard meeting={entry.meetingId} id={id} session={session} outgoing={false} />
      </li>
    </>
  );
};
