import { MobileOnboarding } from '@/widgets/onboarding';
import { SessionGate } from '@/widgets/session-gate';
import { ProfileView } from '@/pages/profile/ui/ProfileView';

export const ProfilePage = () => (
  <SessionGate anonymous={<MobileOnboarding />}>
    {(session) => <ProfileView session={session} />}
  </SessionGate>
);
