import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/features/preparation-task/ui/TaskDialog/TaskDialog.module.css';
import type { PreparationTask } from '@/entities/meeting';
import { Dialog } from '@/shared/ui/Dialog';
import { TaskDetails } from '@/features/preparation-task/ui/TaskDetails';
import { TaskConfirmation } from '@/features/preparation-task/ui/TaskConfirmation';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import type { useTaskPanel } from '@/features/preparation-task/ui/TaskRecord/hooks/useTaskPanel';

export type TaskDialogProps = {
  task: PreparationTask;
  user: string;
  controls: ReturnType<typeof useTaskControls>;
  surface: ReturnType<typeof useTaskPanel>;
};

export const TaskDialog = ({ task, user, controls, surface }: TaskDialogProps) => {
  const mobile = useMobileLayout();

  return (
    <Dialog
      open={surface.panel !== null}
      title={
        surface.panel === 'cancel'
          ? 'Отменить задачу?'
          : surface.panel === 'decline'
            ? 'Отказаться от задачи?'
            : task.title
      }
      onClose={surface.close}
      returnFocus={surface.opener}
      chatAction
      formLayout
    >
      <div
        className={styles.panel}
        data-mobile={mobile}
        hidden={surface.panel !== 'details'}
        ref={surface.details}
        tabIndex={-1}
      >
        <TaskDetails
          task={task}
          user={user}
          controls={controls}
          confirm={surface.confirm}
        />
      </div>
      <div
        className={styles.panel}
        data-mobile={mobile}
        hidden={surface.panel === 'details'}
        ref={surface.confirmation}
        tabIndex={-1}
      >
        {(surface.panel === 'cancel' || surface.panel === 'decline') && (
          <TaskConfirmation
            action={surface.panel}
            title={task.title}
            controls={controls}
            back={surface.close}
            done={surface.finish}
          />
        )}
      </div>
    </Dialog>
  );
};
