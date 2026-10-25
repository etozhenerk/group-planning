import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { Navigate } from 'react-router';
import type { Session } from '@/entities/session';
import { useMeeting } from '@/entities/meeting';
import { Navigation } from '@/widgets/navigation';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';

export type CreatedViewProps = { session: Session; id: string };

export const CreatedView = ({ session, id }: CreatedViewProps) => {
  const query = useMeeting(id, session.user.id);

  if (query.isPending) {
    return (
      <WorkspaceSkeleton layout="form" navigation={<Navigation session={session} />} />
    );
  }

  if (!query.data) {
    return (
      <main id="main">
        <Status
          title="Не удалось открыть встречу"
          text={errorText(query.error)}
          error
          action={() => void query.refetch()}
        />
      </main>
    );
  }

  return <Navigate to={`/meetings/${id}`} replace />;
};
