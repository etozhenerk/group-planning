import type { PreparationTask } from '@/entities/meeting';
import { designTokens } from '@/shared/config/design-tokens';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { Avatar } from '@/shared/ui/Avatar';
import { mobileTaskStatus } from '@/features/preparation-task/model/taskCopy';
import styles from '@/features/preparation-task/ui/TaskStatusRow/TaskStatusRow.module.css';

export type TaskStatusRowProps = { task: PreparationTask; user: string };

export const TaskStatusRow = ({ task, user }: TaskStatusRowProps) => {
  const person = ['completed', 'declined', 'cancelled'].includes(task.state)
    ? task.updatedBy
    : (task.assignee ?? task.recipient);

  return (
    <div className={styles.row} data-state={task.state}>
      {!person && (
        <ChatIcon
          name="people"
          size={designTokens.componentMobilePreparationStatusIconSize}
        />
      )}
      {person && <Avatar name={person.displayName} src={person.avatarUrl} size="small" />}
      <span>{mobileTaskStatus(task, user)}</span>
    </div>
  );
};
