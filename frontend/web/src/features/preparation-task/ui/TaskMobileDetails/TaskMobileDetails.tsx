import type { TaskDetailsProps } from '@/features/preparation-task/ui/TaskDetails/TaskDetails';
import { TaskFacts } from '@/features/preparation-task/ui/TaskFacts';
import { TaskActions } from '@/features/preparation-task/ui/TaskActions';
import { Check, Minus } from 'lucide-react';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import styles from '@/features/preparation-task/ui/TaskMobileDetails/TaskMobileDetails.module.css';

export type TaskMobileDetailsProps = TaskDetailsProps;

export const TaskMobileDetails = ({
  task,
  user,
  controls,
  confirm,
}: TaskMobileDetailsProps) => {
  const labels = {
    offered: 'Предложена',
    accepted: 'В работе',
    completed: 'Выполнено',
    declined: 'Отказ от задачи',
    cancelled: 'Отменено',
  };

  return (
    <div className={styles.details}>
      <div className={styles.body}>
        <div className={styles.status} data-state={task.state}>
          {task.state === 'completed' ? (
            <Check />
          ) : ['declined', 'cancelled'].includes(task.state) ? (
            <Minus />
          ) : (
            <ChatIcon name="task" />
          )}
          <span>{labels[task.state]}</span>
        </div>
        <TaskFacts task={task} user={user} />
        {task.state === 'offered' && task.recipient && (
          <p className={styles.note}>
            {task.recipient.id === user
              ? 'Примите задачу, если готовы за неё отвечать.'
              : 'Задачу сможет принять только выбранный участник.'}
          </p>
        )}
      </div>
      {(controls.actions.length > 0 || controls.problem) && (
        <div className={styles.footer}>
          <TaskActions controls={controls} confirm={confirm} />
        </div>
      )}
    </div>
  );
};
