import type { PreparationTask } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { taskCreatedLabel } from '@/features/preparation-task/ui/TaskDetails/lib/taskCreatedLabel';
import styles from '@/features/preparation-task/ui/TaskFacts/TaskFacts.module.css';

export type TaskFactsProps = { task: PreparationTask; user: string };

export const TaskFacts = ({ task, user }: TaskFactsProps) => {
  const person = task.assignee ?? task.recipient;
  const name = (value: PreparationTask['author']) =>
    value.displayName + (value.id === user ? ' · вы' : '');

  return (
    <dl className={styles.facts}>
      <div>
        <dt>Предложение от</dt>
        <dd>
          <Avatar
            name={task.author.displayName}
            src={task.author.avatarUrl}
            size="small"
          />
          {name(task.author)}
        </dd>
      </div>
      <div>
        <dt>{task.assignee ? 'Исполнитель' : 'Кому предложено'}</dt>
        <dd>
          {person ? (
            <Avatar name={person.displayName} src={person.avatarUrl} size="small" />
          ) : (
            <ChatIcon name="people" />
          )}
          {person ? name(person) : 'Любому участнику'}
        </dd>
      </div>
      <div>
        <dt>Создано</dt>
        <dd>
          <time dateTime={task.createdAt}>{taskCreatedLabel(task.createdAt)}</time>
        </dd>
      </div>
    </dl>
  );
};
