import { useParams } from 'react-router';
import { PublicHeader } from '@/widgets/public-header';
import { InvitationView } from '@/widgets/invitation';
import { useSession } from '@/entities/session';
import { useOpenInvitation } from '@/features/respond';

export const InvitationPage = () => {
  const { token = '' } = useParams();
  const session = useSession();
  const query = useOpenInvitation(token, session.data?.user.id ?? '');

  return (
    <InvitationView
      invitation={query.data ?? null}
      token={token}
      loading={query.isPending}
      error={query.error}
      retry={() => void query.refetch()}
      header={<PublicHeader invitation />}
      session={session.data ?? null}
      sessionPending={session.isPending}
      sessionError={session.error}
      retrySession={() => void session.refetch()}
    />
  );
};
