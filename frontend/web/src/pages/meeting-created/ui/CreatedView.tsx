import { Link, Navigate } from 'react-router';
import { Check } from 'lucide-react';
import type { Session } from '@/entities/session';
import { useMeeting, MeetingFacts } from '@/entities/meeting';
import { Navigation } from '@/widgets/navigation';
import { ShareInvitation } from '@/features/share-invitation';
import { Workspace } from '@/shared/ui/layout';
import { Status } from '@/shared/ui/status';
import { errorText } from '@/shared/api';

export type CreatedViewProps = { session: Session; id: string };

export const CreatedView = ({ session, id }: CreatedViewProps) => {
  const query = useMeeting(id, session.user.id);

  if (query.isPending) {
    return (
      <main id="main">
        <Status title="Загружаем встречу…" />
      </main>
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

  if (query.data.organizerId !== session.user.id) {
    return <Navigate to={`/meetings/${id}`} replace />;
  }

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className="entry-page stack">
        <span className="success-icon">
          <Check aria-hidden="true" size={30} />
        </span>
        <h1>Встреча создана</h1>
        <div className="panel stack">
          <h2>{query.data.title}</h2>
          <MeetingFacts
            startsAt={query.data.startsAt}
            timezone={query.data.timezone}
            place={query.data.place}
          />
        </div>
        <ShareInvitation id={id} />
        <Link className="button primary" to={`/meetings/${id}`}>
          Открыть встречу
        </Link>
        <Link className="button ghost" to="/meetings">
          К моим встречам
        </Link>
      </main>
    </Workspace>
  );
};
