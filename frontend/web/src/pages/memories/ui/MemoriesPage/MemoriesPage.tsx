import { MobileOnboarding } from '@/widgets/onboarding';
import { useParams } from 'react-router';
import { SessionGate } from '@/widgets/session-gate';
import { MemoriesView } from '@/pages/memories/ui/MemoriesView';

export const MemoriesPage = () => {
  const { id = '' } = useParams();

  return (
    <SessionGate anonymous={<MobileOnboarding />}>
      {(session) => <MemoriesView id={id} session={session} />}
    </SessionGate>
  );
};
