import type { Session } from '@/entities/session';
import type { Invitation } from '@/entities/meeting';
import { InvitationAnswer } from '@/features/respond';
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
  return (
    <>
      <div className={styles.selected} inert>
        <InvitationCard item={{ path: `/i/${token}`, preview: invitation }} />
      </div>
      <div className={styles.response}>
        <InvitationAnswer
          session={session}
          token={token}
          invitation={invitation}
          compact
        />
      </div>
    </>
  );
};
