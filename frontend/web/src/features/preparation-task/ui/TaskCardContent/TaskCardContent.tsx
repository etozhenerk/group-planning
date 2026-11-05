import { useMobileLayout } from '@/shared/lib/media';
import { TaskStatusRow } from '@/features/preparation-task/ui/TaskStatusRow';
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
}: TaskCardContentProps) => {
  const mobile = useMobileLayout();

  return (
    <>
      <button
        type="button"
        className={styles.opener}
        data-mobile={mobile}
        onClick={open}
        ref={opener}
        data-chat-surface-trigger
        aria-label={`Подробности задачи «${task.title}»`}
      >
        <strong>{task.title}</strong>
        <ChatIcon name="right" aria-hidden="true" />
      </button>
      <div>
        {mobile ? (
          <TaskStatusRow task={task} user={user} />
        ) : (
          <p className={styles.note}>{taskStatus(task, user)}</p>
        )}
      </div>
      <TaskActions controls={controls} inline />
    </>
  );
};
