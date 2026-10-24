import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { SessionGate } from '@/widgets/session-gate';
import { CreateView } from '@/pages/meeting-create/ui/CreateView';

export const CreatePage = () => {
  return (
    <SessionGate loading={<WorkspaceSkeleton layout="form" />}>
      {(session) => <CreateView session={session} />}
    </SessionGate>
  );
};
