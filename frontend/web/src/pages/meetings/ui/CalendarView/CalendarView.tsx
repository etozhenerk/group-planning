import type { useMeetingsView } from '@/pages/meetings/ui/MeetingsView/hooks/useMeetingsView';
import { CalendarGrid } from '@/pages/meetings/ui/CalendarGrid';
import { MeetingsResults } from '@/pages/meetings/ui/MeetingsResults';
import { HomeEmpty } from '@/pages/meetings/ui/HomeEmpty';
import { UndatedToggle } from '@/pages/meetings/ui/UndatedToggle';
import { Status } from '@/shared/ui/Status';
import { agendaLabel, meetingCountLabel } from '@/pages/meetings/lib/calendarDates';
import styles from '@/pages/meetings/ui/CalendarView/CalendarView.module.css';

export type CalendarViewProps = { view: ReturnType<typeof useMeetingsView> };

export const CalendarView = ({ view }: CalendarViewProps) => {
  return (
    <div className={styles.layout}>
      <div className={styles.month}>
        <CalendarGrid
          day={view.day}
          page={view.month.data?.pages[0]}
          onSelect={view.selectDay}
        />
        {view.month.error && (
          <Status
            title="Не удалось обновить календарь"
            error
            action={() => void view.month.refetch()}
          />
        )}
        <UndatedToggle
          count={view.counts?.undated}
          selected={view.selection.undated}
          onToggle={() => view.update({ undated: !view.selection.undated })}
        />
      </div>
      <section aria-label="Встречи выбранного дня" className={styles.agenda}>
        <h3>{view.selection.undated ? 'Без даты' : agendaLabel(view.day)}</h3>
        {!view.selection.undated && view.query.data && (
          <p className={styles.weekday}>
            {meetingCountLabel(
              view.query.data?.pages[0]?.days.find((entry) => entry.date === view.day)
                ?.count ?? 0,
            )}
          </p>
        )}
        {view.empty ? (
          <HomeEmpty />
        ) : (
          <MeetingsResults
            query={view.ready ? view.query : view.list}
            agenda
            emptyTitle={
              view.selection.undated ? 'Встреч без даты нет.' : 'На этот день встреч нет.'
            }
          />
        )}
      </section>
    </div>
  );
};
