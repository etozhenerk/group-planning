import type { Session } from '@/entities/session';
import type { Invitation } from '@/entities/meeting';
import { ResponseButtons, useJoinDeadline } from '@/features/respond';
import { InvitationCard } from '@/pages/invitations/ui/InvitationCard';
import styles from '@/pages/invitations/ui/SavedInvitationContent/SavedInvitationContent.module.css';

export type SavedInvitationContentProps = {
  session: Session;
  token: string;
  invitation: Invitation;
};

export const SavedInvitationContent = ({
  session,
  token,
  invitation,
}: SavedInvitationContentProps) => {
  const disabledReason = useJoinDeadline(invitation);

  return (
    <>
      <div className={styles.selected} inert>
        <InvitationCard item={{ path: `/i/${token}`, preview: invitation }} />
      </div>
      <div className={styles.response}>
        <ResponseButtons
          session={session}
          id={invitation.meetingId}
          token={token}
          expected={invitation.myRsvpRevision}
          current={invitation.myRsvp}
          joinDisabledReason={disabledReason}
          inMeeting
        />
      </div>
    </>
  );
};
