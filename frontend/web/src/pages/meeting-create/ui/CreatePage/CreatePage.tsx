import { MobileOnboarding } from '@/widgets/onboarding';
import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { SessionGate } from '@/widgets/session-gate';
import { CreateView } from '@/pages/meeting-create/ui/CreateView';

export const CreatePage = () => {
  return (
    <SessionGate
      anonymous={<MobileOnboarding />}
      loading={<WorkspaceSkeleton layout="form" />}
    >
      {(session) => <CreateView session={session} />}
    </SessionGate>
  );
};
