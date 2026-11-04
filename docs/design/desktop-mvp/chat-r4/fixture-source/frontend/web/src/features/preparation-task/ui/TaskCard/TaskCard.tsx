import { ChatIcon } from '@/shared/ui/ChatIcon';
import { usePreparationTask } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { clockLabel } from '@/shared/lib/time';
import { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import { useTaskPanel } from '@/features/preparation-task/ui/TaskCard/hooks/useTaskPanel';
import { TaskCardContent } from '@/features/preparation-task/ui/TaskCardContent';
import { TaskDialog } from '@/features/preparation-task/ui/TaskDialog';
import styles from '@/features/preparation-task/ui/TaskCard/TaskCard.module.css';

export type TaskCardProps = {
  meeting: string;
  id: string;
  session: Session;
  occurredAt: string;
};

export const TaskCard = ({ meeting, id, session, occurredAt }: TaskCardProps) => {
  const query = usePreparationTask(meeting, id, session.user.id);
  const controls = useTaskControls(query.data, meeting, id, session);
  const surface = useTaskPanel(`task:${session.user.id}:${meeting}:${id}`);

  if (query.access.denied) {
    return null;
  }

  return (
    <>
      <section className={styles.card} aria-label="Задача подготовки">
        {query.data ? (
          <>
            <div className={styles.caption}>
              <ChatIcon name="task" />
              <span>Новая задача · {query.data.author.displayName}</span>
              <time dateTime={occurredAt}>{clockLabel(occurredAt)}</time>
            </div>
            <TaskCardContent
              task={query.data}
              user={session.user.id}
              controls={controls}
              opener={surface.opener}
              open={() => surface.show('details')}
            />
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
      {query.data && (
        <TaskDialog
          task={query.data}
          user={session.user.id}
          controls={controls}
          surface={surface}
        />
      )}
    </>
  );
};
