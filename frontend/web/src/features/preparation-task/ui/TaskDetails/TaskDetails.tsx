import type { PreparationTask } from '@/entities/meeting';
import { TaskActions } from '@/features/preparation-task/ui/TaskActions';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import { taskStatus } from '@/features/preparation-task/model/taskCopy';
import { taskCreatedLabel } from '@/features/preparation-task/ui/TaskDetails/lib/taskCreatedLabel';
import { Avatar } from '@/shared/ui/Avatar';
import styles from '@/features/preparation-task/ui/TaskDetails/TaskDetails.module.css';

export type TaskDetailsProps = {
  task: PreparationTask;
  user: string;
  controls: ReturnType<typeof useTaskControls>;
  confirm: (action: 'cancel' | 'decline', opener: HTMLButtonElement) => void;
};

export const TaskDetails = ({ task, user, controls, confirm }: TaskDetailsProps) => (
  <div>
    <p className={styles.status}>{taskStatus(task, user)}</p>
    <dl className={styles.facts}>
      <div>
        <dt>Предложение от</dt>
        <dd>
          <Avatar
            name={task.author.displayName}
            src={task.author.avatarUrl}
            size="tiny"
            tone={task.author.id === user ? 'sand' : 'lilac'}
          />
          {task.author.displayName}
        </dd>
      </div>
      <div>
        <dt>{task.assignee ? 'Исполняет' : 'Кому'}</dt>
        <dd>
          {task.assignee?.displayName ??
            task.recipient?.displayName ??
            'Любому участнику'}
          {!task.assignee && task.recipient?.id === user && ' (вы)'}
        </dd>
      </div>
      <div>
        <dt>Создано</dt>
        <dd>
          <time dateTime={task.createdAt}>{taskCreatedLabel(task.createdAt)}</time>
        </dd>
      </div>
    </dl>
    {task.state === 'accepted' && (
      <p className={styles.note}>После выполнения отметьте результат здесь или в чате.</p>
    )}
    <div className={styles.actions}>
      <TaskActions controls={controls} confirm={confirm} />
    </div>
  </div>
);
