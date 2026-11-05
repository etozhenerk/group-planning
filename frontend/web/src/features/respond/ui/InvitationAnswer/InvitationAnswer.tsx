import { Navigate } from 'react-router';
import { answerLabels, useInvitationAccess } from '@/entities/meeting';
import type { Invitation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { errorText } from '@/shared/api';
import { Skeleton } from '@/shared/ui/Skeleton';
import { Status } from '@/shared/ui/Status';
import { useJoinDeadline } from '@/features/respond/model/useJoinDeadline';
import { ResponseButtons } from '@/features/respond/ui/ResponseButtons';

export type InvitationAnswerProps = {
  session: Session;
  invitation: Invitation;
  token: string;
  compact?: boolean;
};

export const InvitationAnswer = ({
  session,
  invitation,
  token,
  compact = false,
}: InvitationAnswerProps) => {
  const disabledReason = useJoinDeadline(invitation);
  const access = useInvitationAccess(invitation.meetingId, session.user.id);

  if (access.isPending) {
    return (
      <div role="status" aria-label="Проверка доступа к встрече" aria-busy="true">
        <Skeleton height={44} />
      </div>
    );
  }

  if (access.error || (!access.data && invitation.myRsvp === 'going')) {
    return (
      <Status
        title="Не удалось проверить доступ к встрече"
        text={
          access.error
            ? errorText(access.error)
            : 'Обновите приглашение и попробуйте снова.'
        }
        error
        action={() => void access.refetch()}
      />
    );
  }

  if (access.data) {
    return <Navigate to={`/meetings/${invitation.meetingId}`} replace />;
  }

  if (disabledReason) {
    return (
      <Status
        title="Участие закрыто"
        text={
          invitation.myRsvp
            ? `Вы ответили «${answerLabels[invitation.myRsvp]}».`
            : 'Новых участников больше не принимают.'
        }
      />
    );
  }

  return (
    <ResponseButtons
      session={session}
      id={invitation.meetingId}
      title={invitation.title}
      preview={invitation}
      token={token}
      expected={invitation.myRsvpRevision}
      current={invitation.myRsvp}
      joinDisabledReason={disabledReason}
      inMeeting={compact}
    />
  );
};
