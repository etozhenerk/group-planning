import { Link } from 'react-router';
import { Plus, Sparkles } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import { MeetingCard, useMeetings } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { Workspace } from '@/shared/ui/layout';
import { Status } from '@/shared/ui/status';
import { errorText } from '@/shared/api';

export type MeetingsViewProps = { session: Session };

export const MeetingsView = ({ session }: MeetingsViewProps) => {
  const query = useMeetings(session.user.id);

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className="page-content meetings-home">
        <header className="page-heading">
          <h1>Мои встречи</h1>
          <Link className="button primary" to="/meetings/new">
            <Plus aria-hidden="true" size={18} />
            Создать встречу
          </Link>
        </header>
        {query.isPending ? (
          <Status title="Загружаем встречи…" />
        ) : query.error ? (
          <Status
            title="Не удалось получить встречи"
            text={errorText(query.error)}
            error
            action={() => void query.refetch()}
          />
        ) : query.data.pages.every((page) => page.meetings.length === 0) ? (
          <section className="home-empty">
            <Sparkles aria-hidden="true" size={44} />
            <h2>С чего начнём?</h2>
            <p>Создайте встречу и пригласите друзей по ссылке.</p>
            <Link className="button primary" to="/meetings/new">
              Создать первую встречу
            </Link>
          </section>
        ) : (
          <div className="stack">
            {query.data.pages
              .flatMap((page) => page.meetings)
              .map((meeting) => (
                <MeetingCard key={meeting.id} meeting={meeting} />
              ))}
            {query.hasNextPage && (
              <button
                type="button"
                onClick={() => void query.fetchNextPage()}
                disabled={query.isFetchingNextPage}
              >
                Загрузить ещё
              </button>
            )}
          </div>
        )}
      </main>
    </Workspace>
  );
};
