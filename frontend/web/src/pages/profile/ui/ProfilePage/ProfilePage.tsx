import { SessionGate } from '@/widgets/session-gate';
import { ProfileView } from '@/pages/profile/ui/ProfileView';

export const ProfilePage = () => (
  <SessionGate>{(session) => <ProfileView session={session} />}</SessionGate>
);
