import type { PreparationTask } from '@/entities/meeting';
import { TaskActions } from '@/features/preparation-task/ui/TaskActions';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import { taskStateLabel } from '@/features/preparation-task/model/taskCopy';
import styles from '@/features/preparation-task/ui/TaskDetails/TaskDetails.module.css';

export type TaskDetailsProps = {
  task: PreparationTask;
  controls: ReturnType<typeof useTaskControls>;
  confirm: (action: 'cancel' | 'decline', opener: HTMLButtonElement) => void;
};

export const TaskDetails = ({ task, controls, confirm }: TaskDetailsProps) => (
  <div>
    <p className={styles.status}>{taskStateLabel(task)}</p>
    <dl className={styles.facts}>
      <div>
        <dt>Предложение от</dt>
        <dd>{task.author.displayName}</dd>
      </div>
      <div>
        <dt>{task.assignee ? 'Исполняет' : 'Кому'}</dt>
        <dd>
          {task.assignee?.displayName ??
            task.recipient?.displayName ??
            'Любому участнику'}
        </dd>
      </div>
    </dl>
    <div className={styles.actions}>
      <TaskActions controls={controls} confirm={confirm} />
    </div>
  </div>
);
