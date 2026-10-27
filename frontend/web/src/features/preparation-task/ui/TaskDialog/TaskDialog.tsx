import type { PreparationTask } from '@/entities/meeting';
import { Dialog } from '@/shared/ui/Dialog';
import { TaskDetails } from '@/features/preparation-task/ui/TaskDetails';
import { TaskConfirmation } from '@/features/preparation-task/ui/TaskConfirmation';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import type { useTaskPanel } from '@/features/preparation-task/ui/TaskCard/hooks/useTaskPanel';

export type TaskDialogProps = {
  task: PreparationTask;
  controls: ReturnType<typeof useTaskControls>;
  surface: ReturnType<typeof useTaskPanel>;
};

export const TaskDialog = ({ task, controls, surface }: TaskDialogProps) => (
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
  >
    <div hidden={surface.panel !== 'details'} ref={surface.details} tabIndex={-1}>
      <TaskDetails task={task} controls={controls} confirm={surface.confirm} />
    </div>
    <div hidden={surface.panel === 'details'} ref={surface.confirmation} tabIndex={-1}>
      {(surface.panel === 'cancel' || surface.panel === 'decline') && (
        <TaskConfirmation
          action={surface.panel}
          controls={controls}
          back={surface.close}
          done={surface.finish}
        />
      )}
    </div>
  </Dialog>
);
