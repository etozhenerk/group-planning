import { Link } from 'react-router';
import { Plus, Sparkles } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import { MeetingCard } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { Workspace } from '@/shared/ui/layout';
import { Status } from '@/shared/ui/status';
import { useMeetingsView } from '@/pages/meetings/model/useMeetingsView';
import { errorText } from '@/shared/api';

export type MeetingsViewProps = { session: Session };

export const MeetingsView = ({ session }: MeetingsViewProps) => {
  const view = useMeetingsView(session.user.id);
  const query = view.query;

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className="page-content meetings-home">
        <header className="page-heading">
          <h1>Мои встречи</h1>
          {!view.empty && (
            <Link className="button primary" to="/meetings/new">
              <Plus aria-hidden="true" size={18} />
              Создать встречу
            </Link>
          )}
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
        ) : view.empty ? (
          <section className="home-empty">
            <Sparkles aria-hidden="true" size={44} />
            <h2>С чего начнём?</h2>
            <p>Создайте встречу и пригласите друзей по ссылке.</p>
            <Link className="button primary" to="/meetings/new">
              Создать встречу
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
