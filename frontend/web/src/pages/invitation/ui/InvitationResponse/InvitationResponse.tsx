import { Link } from 'react-router';
import type { Invitation } from '@/entities/meeting';
import { useInvitationOrganizer } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ResponseButtons } from '@/features/respond';
import { errorText } from '@/shared/api';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Status } from '@/shared/ui/Status';
import styles from '@/pages/invitation/ui/InvitationResponse/InvitationResponse.module.css';

export type InvitationResponseProps = {
  session: Session;
  invitation: Invitation;
  token: string;
};

export const InvitationResponse = ({
  session,
  invitation,
  token,
}: InvitationResponseProps) => {
  const organizer = useInvitationOrganizer(invitation.meetingId, session.user.id);

  if (organizer.isPending) {
    return (
      <div role="status" aria-label="Проверка доступа к встрече" aria-busy="true">
        <Skeleton height={44} />
      </div>
    );
  }

  if (organizer.error) {
    return (
      <Status
        title="Не удалось проверить доступ к встрече"
        text={errorText(organizer.error)}
        error
        action={() => void organizer.refetch()}
      />
    );
  }

  if (organizer.data) {
    return (
      <div className={styles.stack}>
        <p>Вы организуете эту встречу.</p>
        <Link className={styles.open} to={`/meetings/${invitation.meetingId}`}>
          Открыть встречу
        </Link>
      </div>
    );
  }

  return (
    <ResponseButtons
      session={session}
      id={invitation.meetingId}
      token={token}
      expected={invitation.myRsvpRevision}
      current={invitation.myRsvp}
    />
  );
};
