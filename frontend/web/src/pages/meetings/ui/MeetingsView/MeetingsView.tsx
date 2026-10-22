import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import type { Session } from '@/entities/session';
import { Workspace } from '@/shared/ui/Workspace';
import { useMeetingsView } from '@/pages/meetings/ui/MeetingsView/hooks/useMeetingsView';
import { HomeToolbar } from '@/pages/meetings/ui/HomeToolbar';
import { HomeEmpty } from '@/pages/meetings/ui/HomeEmpty';
import { CalendarView } from '@/pages/meetings/ui/CalendarView';
import { MeetingsResults } from '@/pages/meetings/ui/MeetingsResults';
import { UndatedToggle } from '@/pages/meetings/ui/UndatedToggle';
import styles from '@/pages/meetings/ui/MeetingsView/MeetingsView.module.css';

export type MeetingsViewProps = { session: Session };

export const MeetingsView = ({ session }: MeetingsViewProps) => {
  const view = useMeetingsView(session.user.id);

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.home}>
        <header className={styles.heading} data-testid="page-heading">
          <h1>Мои встречи</h1>
          {!view.empty && (
            <Link
              className={styles.create}
              to={view.createPath}
              aria-label="Создать встречу"
            >
              <Plus aria-hidden="true" size={18} />
              Создать
            </Link>
          )}
        </header>
        <HomeToolbar
          selection={view.selection}
          counts={view.counts}
          update={view.update}
        />
        {view.calendar ? (
          <CalendarView view={view} />
        ) : view.empty ? (
          <HomeEmpty createPath={view.createPath} />
        ) : (
          <>
            <MeetingsResults
              query={view.query}
              emptyTitle={
                view.selection.undated
                  ? 'Встреч без даты нет.'
                  : view.selection.period === 'past'
                    ? 'Нет прошедших встреч'
                    : 'Нет предстоящих встреч'
              }
            />
            <UndatedToggle
              count={view.counts?.undated}
              selected={view.selection.undated}
              onToggle={() => view.update({ undated: !view.selection.undated })}
            />
          </>
        )}
      </main>
    </Workspace>
  );
};
