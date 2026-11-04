import { useMobileLayout } from '@/shared/lib/media';
import { HomeViewToggle } from '@/pages/meetings/ui/HomeViewToggle';
import { usePeriodIndicator } from '@/pages/meetings/ui/HomeToolbar/hooks/usePeriodIndicator';
import { Calendar, List } from 'lucide-react';
import type { CalendarCounts, MeetingPeriod } from '@/entities/meeting';
import type { HomeSelection } from '@/pages/meetings/model/selection';
import styles from '@/pages/meetings/ui/HomeToolbar/HomeToolbar.module.css';

export type HomeToolbarProps = {
  selection: HomeSelection;
  counts: CalendarCounts | undefined;
  update: (patch: Partial<HomeSelection>) => void;
};

export const HomeToolbar = ({ selection, counts, update }: HomeToolbarProps) => {
  const mobile = useMobileLayout();
  const tabs = usePeriodIndicator(
    selection.period,
    counts && counts.upcoming + counts.past,
  );

  return (
    <div className={styles.toolbar} data-mobile={mobile}>
      <nav ref={tabs} aria-label="Период встреч" className={styles.periods}>
        <span className={styles.indicator} aria-hidden="true" />
        {(['upcoming', 'past'] as MeetingPeriod[]).map((period) => (
          <button
            key={period}
            type="button"
            aria-pressed={selection.period === period}
            onClick={() => update({ period, undated: false })}
          >
            {period === 'upcoming' ? 'Предстоящие' : 'Прошедшие'}
            {counts && <span className={styles.count}>{counts[period]}</span>}
          </button>
        ))}
      </nav>
      {mobile ? (
        <HomeViewToggle
          view={selection.view}
          onToggle={() =>
            update({ view: selection.view === 'calendar' ? 'list' : 'calendar' })
          }
        />
      ) : (
        <nav aria-label="Вид встреч" className={styles.views}>
          <button
            type="button"
            aria-pressed={selection.view === 'list'}
            onClick={() => update({ view: 'list' })}
          >
            <List size={17} aria-hidden="true" />
            Список
          </button>
          <button
            type="button"
            aria-pressed={selection.view === 'calendar'}
            onClick={() => update({ view: 'calendar' })}
          >
            <Calendar size={17} aria-hidden="true" />
            Календарь
          </button>
        </nav>
      )}
    </div>
  );
};
