import { WorkspaceSkeleton } from '@/shared/ui/WorkspaceSkeleton';
import { MeetingHeader } from '@/pages/meeting/ui/MeetingHeader';
import styles from '@/pages/meeting/ui/MeetingView/MeetingView.module.css';
import { Link } from 'react-router';
import type { Session } from '@/entities/session';
import { Navigation } from '@/widgets/navigation';
import { FeedTimeline } from '@/widgets/conversation';
import { MeetingDetails } from '@/widgets/meeting-details';
import { Workspace } from '@/shared/ui/Workspace';
import { Status } from '@/shared/ui/Status';
import { errorText } from '@/shared/api';
import { useMeetingView } from '@/pages/meeting/ui/MeetingView/hooks/useMeetingView';

export type MeetingViewProps = { id: string; session: Session };

export const MeetingView = ({ id, session }: MeetingViewProps) => {
  const view = useMeetingView(id, session.user.id);
  const query = view.query;

  if (query.access.denied) {
    return (
      <Workspace navigation={<Navigation session={session} />}>
        <main id="main" className={[styles['entry-page'], styles['stack']].join(' ')}>
          <h1>Переписка закрыта</h1>
          <p className={styles['muted']}>Для доступа нужен сохранённый ответ «Приду».</p>
          {view.invitation ? (
            <Link
              className={[styles['button'], styles['primary']].join(' ')}
              to={`/i/${view.invitation}`}
            >
              Открыть приглашение
            </Link>
          ) : (
            <p>Откройте ссылку приглашения, чтобы проверить или изменить ответ.</p>
          )}
          <Link className={styles['button']} to="/meetings">
            К моим встречам
          </Link>
        </main>
      </Workspace>
    );
  }

  if (query.isPending) {
    return (
      <WorkspaceSkeleton
        layout="conversation"
        navigation={<Navigation session={session} />}
      />
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
      <main id="main" className={styles['conversation']}>
        <MeetingHeader
          id={id}
          title={query.data.title}
          organizer={query.data.organizerId === session.user.id}
          wide={view.wide}
          showDetails={view.details.show}
        />
        <FeedTimeline id={id} session={session} />
      </main>
      <MeetingDetails
        meeting={query.data}
        session={session}
        open={view.details.open}
        wide={view.wide}
        close={view.details.close}
      />
    </Workspace>
  );
};
