import { useParams } from 'react-router';
import { SessionGate } from '@/widgets/session-gate';
import { UploadView } from '@/pages/meeting-upload/ui/UploadView';

export const UploadPage = () => {
  const { id = '' } = useParams();

  return (
    <SessionGate>{(session) => <UploadView id={id} session={session} />}</SessionGate>
  );
};
