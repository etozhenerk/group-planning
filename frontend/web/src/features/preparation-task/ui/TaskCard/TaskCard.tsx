import { usePreparationTask } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { TaskActions } from '@/features/preparation-task/ui/TaskActions';
import { taskStatus } from '@/features/preparation-task/model/taskCopy';
import styles from '@/features/preparation-task/ui/TaskCard/TaskCard.module.css';

export type TaskCardProps = {
  meeting: string;
  id: string;
  session: Session;
  outgoing: boolean;
};

export const TaskCard = ({ meeting, id, session, outgoing }: TaskCardProps) => {
  const query = usePreparationTask(meeting, id, session.user.id);

  if (query.access.denied) {
    return null;
  }

  return (
    <section
      className={[styles.card, outgoing ? styles.outgoing : ''].join(' ')}
      aria-label="Задача подготовки"
    >
      {query.data ? (
        <>
          <h3>{query.data.title}</h3>
          <p className={styles.note}>{taskStatus(query.data, session.user.id)}</p>
          <TaskActions task={query.data} session={session} />
        </>
      ) : query.isPending ? (
        <SkeletonRows label="Загрузка задачи" variant="agenda" />
      ) : null}
      {query.error && (
        <div role="alert">
          <p>Не удалось загрузить задачу.</p>
          <button type="button" onClick={() => void query.refetch()}>
            Повторить
          </button>
        </div>
      )}
    </section>
  );
};
