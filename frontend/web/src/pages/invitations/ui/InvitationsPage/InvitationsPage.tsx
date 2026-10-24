import { SessionGate } from '@/widgets/session-gate';
import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { InvitationsView } from '@/pages/invitations/ui/InvitationsView';

export const InvitationsPage = () => (
  <SessionGate loading={<WorkspaceSkeleton layout="list" />}>
    {(session) => <InvitationsView session={session} />}
  </SessionGate>
);
