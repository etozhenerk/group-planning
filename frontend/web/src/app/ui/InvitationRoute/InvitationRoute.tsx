import { useLocation } from 'react-router';
import { useMobileLayout } from '@/shared/lib/media';
import { SavedInvitationPage } from '@/pages/invitations';
import { InvitationPage } from '@/pages/invitation';

export const InvitationRoute = () => {
  const location = useLocation();
  const state: unknown = location.state;
  const mobile = useMobileLayout();
  const fromInvitations =
    state !== null &&
    typeof state === 'object' &&
    'source' in state &&
    state.source === 'invitations';

  return mobile && fromInvitations ? <SavedInvitationPage /> : <InvitationPage />;
};
