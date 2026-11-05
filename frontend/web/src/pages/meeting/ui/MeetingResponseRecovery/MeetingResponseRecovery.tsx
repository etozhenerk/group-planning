import type { Session } from '@/entities/session';
import type { ResponseRequest } from '@/features/respond';
import { InvitationView } from '@/widgets/invitation';
import { PublicHeader } from '@/widgets/public-header';

export type MeetingResponseRecoveryProps = { request: ResponseRequest; session: Session };

export const MeetingResponseRecovery = ({
  request,
  session,
}: MeetingResponseRecoveryProps) => (
  <InvitationView
    invitation={request.preview}
    token={request.token}
    loading={false}
    error={null}
    retry={() => {}}
    header={<PublicHeader invitation />}
    session={session}
    sessionPending={false}
    sessionError={null}
    retrySession={() => {}}
    recovery
  />
);
