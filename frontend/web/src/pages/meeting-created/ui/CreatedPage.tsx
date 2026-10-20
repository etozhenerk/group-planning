import { useParams } from 'react-router';
import { SessionGate } from '@/widgets/session-gate';
import { CreatedView } from '@/pages/meeting-created/ui/CreatedView';

export const CreatedPage = () => {
  const { id = '' } = useParams();

  return (
    <SessionGate>{(session) => <CreatedView session={session} id={id} />}</SessionGate>
  );
};
