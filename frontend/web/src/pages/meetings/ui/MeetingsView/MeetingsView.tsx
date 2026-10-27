import { useMeetingListUpdates } from '@/entities/meeting';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import type { Session } from '@/entities/session';
import { Workspace } from '@/shared/ui/Workspace';
import { useStickyControls } from '@/pages/meetings/ui/MeetingsView/hooks/useStickyControls';
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
  useMeetingListUpdates(session.user.id);
  const { sentinelRef, controlsRef, pinned } = useStickyControls();

  return (
    <Workspace navigation={<Navigation session={session} sticky />}>
      <main id="main" className={styles.home}>
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
        <div
          ref={controlsRef}
          className={styles.controls}
          data-pinned={pinned}
          data-testid="meetings-controls"
        >
          <header className={styles.heading} data-testid="page-heading">
            <h1>Мои встречи</h1>
            {(view.calendar || !view.empty) && (
              <Link
                className={`${styles.create} ${view.calendar && view.empty ? styles['empty-calendar-create'] : ''}`}
                to={view.createPath}
                aria-label="Создать встречу"
              >
                <Plus aria-hidden="true" size={18} />
                Создать
              </Link>
            )}
          </header>
        </div>
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
