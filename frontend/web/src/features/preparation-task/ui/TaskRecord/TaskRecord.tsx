import { usePreparationTask } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import { useTaskPanel } from '@/features/preparation-task/ui/TaskRecord/hooks/useTaskPanel';
import { TaskCard } from '@/features/preparation-task/ui/TaskCard';
import { TaskCardContent } from '@/features/preparation-task/ui/TaskCardContent';
import { TaskDialog } from '@/features/preparation-task/ui/TaskDialog';

export type TaskRecordProps = {
  meeting: string;
  id: string;
  session: Session;
  occurredAt: string;
};

export const TaskRecord = ({ meeting, id, session, occurredAt }: TaskRecordProps) => {
  const query = usePreparationTask(meeting, id, session.user.id);
  const controls = useTaskControls(query.data, meeting, id, session);
  const surface = useTaskPanel(`task:${session.user.id}:${meeting}:${id}`);

  if (query.access.denied) {
    return null;
  }

  return (
    <>
      <TaskCard
        task={query.data}
        occurredAt={occurredAt}
        pending={query.isPending}
        error={query.error}
        retry={() => void query.refetch()}
      >
        {query.data && (
          <TaskCardContent
            task={query.data}
            user={session.user.id}
            controls={controls}
            opener={surface.opener}
            open={() => surface.show('details')}
          />
        )}
      </TaskCard>
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
