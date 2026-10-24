import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { SessionGate } from '@/widgets/session-gate';
import { MeetingsView } from '@/pages/meetings/ui/MeetingsView';

export const MeetingsPage = () => {
  return (
    <SessionGate loading={<WorkspaceSkeleton layout="list" />}>
      {(session) => <MeetingsView session={session} />}
    </SessionGate>
  );
};
