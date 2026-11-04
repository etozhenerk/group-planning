import { useLocation } from 'react-router';
import { useSavedInvitations } from '@/entities/meeting';
import { invitationOrganizer } from '@/pages/invitations/model/invitationContext';
import type { Session } from '@/entities/session';
import { useOpenInvitation } from '@/features/respond';
import { SkeletonDetails } from '@/shared/ui/SkeletonDetails';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { SavedInvitationLayout } from '@/pages/invitations/ui/SavedInvitationLayout';
import { SavedInvitationContent } from '@/pages/invitations/ui/SavedInvitationContent';

export type SavedInvitationViewProps = { session: Session; token: string };

export const SavedInvitationView = ({ session, token }: SavedInvitationViewProps) => {
  const query = useOpenInvitation(token, session.user.id);
  const location = useLocation();
  const saved = useSavedInvitations(session.user.id);
  const canonical = saved.data?.pages
    .flatMap((page) => page.invitations)
    .find((item) => item.preview.meetingId === query.data?.meetingId)?.preview.organizer;

  const organizer = canonical ?? invitationOrganizer(location.state);

  return (
    <SavedInvitationLayout>
      {query.isPending ? (
        <SkeletonDetails label="Загрузка приглашения" />
      ) : (
        <>
          {query.error && (
            <Status
              title="Приглашение недоступно"
              text={errorText(query.error)}
              error
              variant={query.data ? 'refresh' : 'panel'}
              action={() => void query.refetch()}
            />
          )}
          {query.data && (
            <SavedInvitationContent
              session={session}
              token={token}
              invitation={{ ...query.data, ...(organizer ? { organizer } : {}) }}
            />
          )}
        </>
      )}
    </SavedInvitationLayout>
  );
};
