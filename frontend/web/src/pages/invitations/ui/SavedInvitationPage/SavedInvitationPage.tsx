import { MobileOnboarding } from '@/widgets/onboarding';
import { useParams } from 'react-router';
import { SessionGate } from '@/widgets/session-gate';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { SavedInvitationLayout } from '@/pages/invitations/ui/SavedInvitationLayout';
import { SavedInvitationView } from '@/pages/invitations/ui/SavedInvitationView';

export const SavedInvitationPage = () => {
  const { token = '' } = useParams();

  return (
    <SessionGate
      anonymous={<MobileOnboarding />}
      context={{ kind: 'invitation', token }}
      loading={
        <SavedInvitationLayout>
          <SkeletonDetails label="Загрузка приглашения" />
        </SavedInvitationLayout>
      }
    >
      {(session) => <SavedInvitationView session={session} token={token} />}
    </SessionGate>
  );
};
