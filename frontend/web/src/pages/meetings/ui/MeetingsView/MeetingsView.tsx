import { useMobileLayout } from '@/shared/lib/media';
import { designTokens } from '@/shared/config/design-tokens';
import { HomeContent } from '@/pages/meetings/ui/HomeContent';
import { useHomeScroll } from '@/pages/meetings/ui/MeetingsView/hooks/useHomeScroll';
import { useMeetingListUpdates } from '@/entities/meeting';
import { Link } from 'react-router';
import { Plus } from 'lucide-react';
import { Navigation } from '@/widgets/navigation';
import type { Session } from '@/entities/session';
import { Workspace } from '@/shared/ui/Workspace';
import { useStickyControls } from '@/pages/meetings/ui/MeetingsView/hooks/useStickyControls';
import { useMeetingsView } from '@/pages/meetings/ui/MeetingsView/hooks/useMeetingsView';
import { HomeToolbar } from '@/pages/meetings/ui/HomeToolbar';
import styles from '@/pages/meetings/ui/MeetingsView/MeetingsView.module.css';

export type MeetingsViewProps = { session: Session };

export const MeetingsView = ({ session }: MeetingsViewProps) => {
  const view = useMeetingsView(session.user.id);
  const mobile = useMobileLayout();
  const scroll = useHomeScroll(
    session.user.id,
    view.selection,
    mobile,
    !view.query.isPending && (!view.calendar || !view.month.isPending),
  );

  useMeetingListUpdates(session.user.id);
  const { sentinelRef, controlsRef, pinned } = useStickyControls();

  return (
    <Workspace navigation={<Navigation session={session} sticky />} screen>
      <main id="main" className={styles.home} data-mobile={mobile}>
        <div ref={sentinelRef} className={styles.sentinel} aria-hidden="true" />
        <div
          ref={controlsRef}
          className={styles.controls}
          data-pinned={pinned}
          data-testid="meetings-controls"
        >
          <header className={styles.heading} data-testid="page-heading">
            <h1>Мои встречи</h1>
            {(view.calendar || !(mobile ? view.listEmpty || view.empty : view.empty)) && (
              <Link
                className={`${styles.create} ${view.calendar && view.empty ? styles['empty-calendar-create'] : ''}`}
                to={view.createPath}
                aria-label="Создать встречу"
              >
                <Plus
                  aria-hidden="true"
                  size={
                    mobile
                      ? Number.parseFloat(
                          designTokens.componentMobileMeetingsCreateIconSize,
                        )
                      : 18
                  }
                />
                Создать
              </Link>
            )}
          </header>
          {mobile && (
            <HomeToolbar
              selection={view.selection}
              counts={view.counts}
              update={view.update}
            />
          )}
        </div>
        {!mobile && (
          <HomeToolbar
            selection={view.selection}
            counts={view.counts}
            update={view.update}
          />
        )}
        <div
          ref={scroll}
          className={styles.scroll}
          data-testid="meetings-scroll"
          data-view={view.selection.view}
        >
          <HomeContent view={view} />
        </div>
      </main>
    </Workspace>
  );
};
