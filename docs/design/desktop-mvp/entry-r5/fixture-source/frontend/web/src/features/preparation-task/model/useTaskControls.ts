import type { PreparationTask, PreparationAction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError } from '@/shared/api';
import {
  taskActions,
  taskError,
  uncertainTaskError,
} from '@/features/preparation-task/model/taskCopy';
import { useTaskAction } from '@/features/preparation-task/model/useTaskAction';

export const useTaskControls = (
  task: PreparationTask | undefined,
  meeting: string,
  id: string,
  session: Session,
) => {
  const mutation = useTaskAction(meeting, id, session);
  const unchanged = !mutation.variables || task?.revision === mutation.variables.revision;
  const uncertain = unchanged && uncertainTaskError(mutation.error);
  const conflict = mutation.error instanceof ApiError && mutation.error.status === 409;

  return {
    actions: task ? taskActions(task) : [],
    disabled: mutation.isPending || uncertain || (conflict && unchanged),
    pending: mutation.isPending ? mutation.variables?.action : undefined,
    problem: mutation.error && (unchanged || conflict) ? taskError(mutation.error) : '',
    retryable: uncertain && !!mutation.variables,
    retry: (complete?: () => void) => {
      if (mutation.variables) {
        mutation.mutate(
          mutation.variables,
          complete ? { onSuccess: complete } : undefined,
        );
      }
    },
    act: (action: PreparationAction, complete?: () => void) => {
      if (task && taskActions(task).some((available) => available.action === action)) {
        mutation.mutate(
          { action, revision: task.revision },
          complete ? { onSuccess: complete } : undefined,
        );
      }
    },
  };
};
