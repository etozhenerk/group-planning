import { SessionGate } from '@/widgets/session-gate';
import { CreateView } from '@/pages/meeting-create/ui/CreateView';

export const CreatePage = () => {
  return <SessionGate>{(session) => <CreateView session={session} />}</SessionGate>;
};
