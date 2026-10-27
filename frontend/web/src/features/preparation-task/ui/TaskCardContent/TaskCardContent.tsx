import { ChatIcon } from '@/shared/ui/ChatIcon';
import type { RefObject } from 'react';
import type { PreparationTask } from '@/entities/meeting';
import { TaskActions } from '@/features/preparation-task/ui/TaskActions';
import { taskStatus } from '@/features/preparation-task/model/taskCopy';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import styles from '@/features/preparation-task/ui/TaskCardContent/TaskCardContent.module.css';

export type TaskCardContentProps = {
  task: PreparationTask;
  user: string;
  controls: ReturnType<typeof useTaskControls>;
  opener: RefObject<HTMLButtonElement | null>;
  open: () => void;
};

export const TaskCardContent = ({
  task,
  user,
  controls,
  opener,
  open,
}: TaskCardContentProps) => (
  <>
    <button
      type="button"
      className={styles.opener}
      onClick={open}
      ref={opener}
      data-chat-surface-trigger
      aria-label={`Подробности задачи «${task.title}»`}
    >
      <strong>{task.title}</strong>
      <ChatIcon name="right" aria-hidden="true" />
    </button>
    <p className={styles.note}>{taskStatus(task, user)}</p>
    <TaskActions controls={controls} inline />
  </>
);
