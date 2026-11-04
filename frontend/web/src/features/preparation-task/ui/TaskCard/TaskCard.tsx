import type { ReactNode } from 'react';
import type { PreparationTask } from '@/entities/meeting';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { clockLabel } from '@/shared/lib/time';
import styles from '@/features/preparation-task/ui/TaskCard/TaskCard.module.css';

export type TaskCardProps = {
  task: PreparationTask | undefined;
  occurredAt: string;
  children: ReactNode;
  pending?: boolean;
  error?: unknown;
  retry?: () => void;
};

export const TaskCard = ({
  task,
  occurredAt,
  children,
  pending = false,
  error,
  retry,
}: TaskCardProps) => (
  <section className={styles.card} aria-label="Задача подготовки">
    {task ? (
      <>
        <div className={styles.caption}>
          <ChatIcon name="task" />
          <span>Новая задача · {task.author.displayName}</span>
          <time dateTime={occurredAt}>{clockLabel(occurredAt)}</time>
        </div>
        {children}
      </>
    ) : pending ? (
      <SkeletonRows label="Загрузка задачи" variant="agenda" />
    ) : null}
    {!!error && (
      <div role="alert">
        <p>Не удалось загрузить задачу.</p>
        <button type="button" onClick={retry}>
          Повторить
        </button>
      </div>
    )}
  </section>
);
