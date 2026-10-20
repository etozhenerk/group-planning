import { useParams } from 'react-router';
import { storedInvitation } from '@/entities/meeting';
import { SessionGate } from '@/widgets/session-gate';
import { MeetingView } from '@/pages/meeting/ui/MeetingView';

export const MeetingPage = () => {
  const { id = '' } = useParams();
  const token = storedInvitation(id);

  return (
    <SessionGate context={token ? { kind: 'invitation', token } : { kind: 'home' }}>
      {(session) => (
        <MeetingView key={`${session.user.id}:${id}`} session={session} id={id} />
      )}
    </SessionGate>
  );
};
