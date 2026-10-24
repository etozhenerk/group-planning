import type { PreparationTask } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError } from '@/shared/api';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import {
  taskActions,
  taskError,
  uncertainTaskError,
} from '@/features/preparation-task/model/taskCopy';
import { useTaskAction } from '@/features/preparation-task/model/useTaskAction';
import styles from '@/features/preparation-task/ui/TaskActions/TaskActions.module.css';

export type TaskActionsProps = { task: PreparationTask; session: Session };

export const TaskActions = ({ task, session }: TaskActionsProps) => {
  const mutation = useTaskAction(task.meetingId, task.id, session);
  const unchanged = !mutation.variables || task.revision === mutation.variables.revision;
  const uncertain = unchanged && uncertainTaskError(mutation.error);
  const conflict = mutation.error instanceof ApiError && mutation.error.status === 409;

  return (
    <div>
      <div className={styles.actions}>
        {taskActions(task).map(({ action, label }) => (
          <button
            key={action}
            type="button"
            className={action === 'cancel' ? styles.cancel : undefined}
            disabled={mutation.isPending || uncertain || (conflict && unchanged)}
            aria-label={label}
            aria-busy={mutation.isPending && mutation.variables?.action === action}
            onClick={() => mutation.mutate({ action, revision: task.revision })}
          >
            {mutation.isPending && mutation.variables?.action === action ? (
              <ButtonSpinner />
            ) : (
              label
            )}
          </button>
        ))}
      </div>
      {mutation.error && (unchanged || conflict) && (
        <div role="alert" className={styles.error}>
          <p>{taskError(mutation.error)}</p>
          {uncertain && mutation.variables && (
            <button
              type="button"
              disabled={mutation.isPending}
              aria-label="Повторить действие"
              onClick={() => {
                if (mutation.variables) {
                  mutation.mutate(mutation.variables);
                }
              }}
            >
              Повторить
            </button>
          )}
        </div>
      )}
    </div>
  );
};
