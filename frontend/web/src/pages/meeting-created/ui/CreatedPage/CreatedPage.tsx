import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { useParams } from 'react-router';
import { SessionGate } from '@/widgets/session-gate';
import { CreatedView } from '@/pages/meeting-created/ui/CreatedView';

export const CreatedPage = () => {
  const { id = '' } = useParams();

  return (
    <SessionGate loading={<WorkspaceSkeleton layout="form" />}>
      {(session) => <CreatedView session={session} id={id} />}
    </SessionGate>
  );
};
