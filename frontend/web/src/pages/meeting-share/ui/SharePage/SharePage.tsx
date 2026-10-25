import { useParams } from 'react-router';
import { SessionGate } from '@/widgets/session-gate';
import { ShareView } from '@/pages/meeting-share/ui/ShareView';

export const SharePage = () => {
  const { id = '' } = useParams();

  return (
    <SessionGate>{(session) => <ShareView id={id} session={session} />}</SessionGate>
  );
};
