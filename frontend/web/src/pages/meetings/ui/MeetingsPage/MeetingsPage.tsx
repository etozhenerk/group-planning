import { SessionGate } from '@/widgets/session-gate';
import { MeetingsView } from '@/pages/meetings/ui/MeetingsView';

export const MeetingsPage = () => {
  return <SessionGate>{(session) => <MeetingsView session={session} />}</SessionGate>;
};
