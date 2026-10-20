import { Link } from 'react-router';
import { ArrowLeft, Info } from 'lucide-react';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { FeedTimeline } from '@/widgets/conversation';
import { MeetingDetails } from '@/widgets/meeting-details';
import { ShareInvitation } from '@/features/share-invitation';
import { Workspace } from '@/shared/ui/layout';
import { Status } from '@/shared/ui/status';
import { errorText } from '@/shared/api';
import { useMeetingView } from '@/pages/meeting/model/useMeetingView';

export type MeetingViewProps = { id: string; session: Session };

export const MeetingView = ({ id, session }: MeetingViewProps) => {
  const view = useMeetingView(id, session.user.id);
  const query = view.query;

  if (query.access.denied) {
    return (
      <Workspace navigation={<Navigation session={session} />}>
        <main id="main" className="entry-page stack">
          <h1>Переписка закрыта</h1>
          <p className="muted">Для доступа нужен сохранённый ответ «Приду».</p>
          {view.invitation ? (
            <Link className="button primary" to={`/invitations/${view.invitation}`}>
              Открыть приглашение
            </Link>
          ) : (
            <p>Откройте ссылку приглашения, чтобы проверить или изменить ответ.</p>
          )}
          <Link className="button" to="/meetings">
            К моим встречам
          </Link>
        </main>
      </Workspace>
    );
  }

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

  return (
    <Workspace navigation={<Navigation session={session} />} conversation>
      <main id="main" className="conversation">
        <header className="conversation-header">
          <Link to="/meetings" className="button icon ghost" aria-label="К моим встречам">
            <ArrowLeft aria-hidden="true" size={20} />
          </Link>
          <div className="grow">
            <strong>{query.data.title}</strong>
            <small>Участников: {query.data.participantCount}</small>
          </div>
          {query.data.organizerId === session.user.id && (
            <div className="header-share">
              <ShareInvitation id={id} />
            </div>
          )}
          <button
            className="icon ghost"
            type="button"
            onClick={view.details.show}
            aria-label="Информация о встрече"
          >
            <Info aria-hidden="true" size={22} />
          </button>
        </header>
        <FeedTimeline id={id} session={session} meeting={query.data} />
      </main>
      <MeetingDetails
        meeting={query.data}
        session={session}
        open={view.details.open}
        close={view.details.close}
      />
    </Workspace>
  );
};
