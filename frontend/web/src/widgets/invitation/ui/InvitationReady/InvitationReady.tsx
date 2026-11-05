import { useMobileLayout } from '@/shared/lib/media';
import { AuthNotice } from '@/features/sign-in';
import { useJoinDeadline } from '@/features/respond';
import { useInvitationAccess } from '@/entities/meeting';
import type { Invitation } from '@/entities/meeting';
import type { InvitationViewProps } from '@/widgets/invitation/ui/InvitationView';
import { InvitationSurface } from '@/widgets/invitation/ui/InvitationSurface';
import { InvitationDetails } from '@/widgets/invitation/ui/InvitationDetails';
import { InvitationActions } from '@/widgets/invitation/ui/InvitationActions';
import { InvitationClosed } from '@/widgets/invitation/ui/InvitationClosed';
import { InvitationReturn } from '@/widgets/invitation/ui/InvitationReturn';

export type InvitationReadyProps = Omit<
  InvitationViewProps,
  'invitation' | 'loading' | 'error' | 'retry'
> & { invitation: Invitation };

export const InvitationReady = ({
  invitation,
  header,
  token,
  session,
  sessionPending,
  sessionError,
  retrySession,
  recovery,
}: InvitationReadyProps) => {
  const closed = useJoinDeadline(invitation);
  const mobile = useMobileLayout();
  const access = useInvitationAccess(
    invitation.meetingId,
    recovery ? '' : (session?.user.id ?? ''),
  );

  const hideActions = mobile && !!closed && (!session || access.data === false);

  return (
    <InvitationSurface
      header={header}
      actionsVisible={!hideActions}
      notice={<AuthNotice />}
      actions={
        <InvitationActions
          invitation={invitation}
          token={token}
          session={session}
          sessionPending={sessionPending}
          sessionError={sessionError}
          retrySession={retrySession}
          recovery={recovery}
        />
      }
      footer={<InvitationReturn signedIn={!!session} />}
    >
      <InvitationDetails
        invitation={invitation}
        closed={mobile && closed ? <InvitationClosed answer={invitation.myRsvp} /> : null}
      />
    </InvitationSurface>
  );
};
