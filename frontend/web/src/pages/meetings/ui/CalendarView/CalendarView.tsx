import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { useChatLayout } from '@/shared/lib/media';
import type { useMeetingsView } from '@/pages/meetings/ui/MeetingsView/hooks/useMeetingsView';
import { CalendarGrid } from '@/entities/meeting';
import { MeetingsResults } from '@/pages/meetings/ui/MeetingsResults';
import { HomeEmpty } from '@/pages/meetings/ui/HomeEmpty';
import { UndatedToggle } from '@/pages/meetings/ui/UndatedToggle';
import { MeetingsFailure } from '@/pages/meetings/ui/MeetingsFailure';
import { agendaLabel, meetingCountLabel } from '@/entities/meeting';
import styles from '@/pages/meetings/ui/CalendarView/CalendarView.module.css';

export type CalendarViewProps = { view: ReturnType<typeof useMeetingsView> };

export const CalendarView = ({ view }: CalendarViewProps) => {
  const layout = useChatLayout();

  if (layout.mobile && !view.month.data && (view.month.error || view.list.error)) {
    return (
      <MeetingsFailure
        title="Не удалось загрузить встречи"
        refresh={false}
        onRetry={view.retryCalendar}
      />
    );
  }

  if (layout.mobile && !view.month.data && view.month.isPending) {
    return <SkeletonRows label="Загрузка календаря" />;
  }

  return (
    <div
      className={styles.layout}
      data-mobile={layout.mobile}
      data-narrow={layout.narrow}
    >
      <div className={styles.month}>
        <CalendarGrid
          day={view.day}
          page={view.month.data?.pages[0]}
          onSelect={view.selectDay}
        />
        {view.month.error && (
          <MeetingsFailure
            title={
              layout.mobile
                ? 'Не удалось обновить встречи'
                : 'Не удалось обновить календарь'
            }
            refresh={!!view.month.data}
            onRetry={layout.mobile ? view.retryCalendar : () => void view.month.refetch()}
          />
        )}
        {!layout.mobile && (
          <UndatedToggle
            count={view.counts?.undated}
            selected={view.selection.undated}
            onToggle={() => view.update({ undated: !view.selection.undated })}
          />
        )}
      </div>
      <section aria-label="Встречи выбранного дня" className={styles.agenda}>
        <div className={styles.heading}>
          <h3>{view.selection.undated ? 'Без даты' : agendaLabel(view.day)}</h3>
          {!view.selection.undated && (
            <p className={styles.weekday}>
              {view.dayCount === undefined ? '\u00a0' : meetingCountLabel(view.dayCount)}
            </p>
          )}
        </div>
        {view.empty && (
          <div className={styles['desktop-empty']}>
            <HomeEmpty createPath={view.createPath} />
          </div>
        )}
        <div className={view.empty ? styles['mobile-results'] : undefined}>
          <MeetingsResults
            key={`${view.day}-${view.selection.undated}`}
            query={view.ready ? view.query : view.list}
            showError={!layout.mobile || !view.month.error}
            agenda
            emptyTitle={
              view.selection.undated ? 'Встреч без даты нет.' : 'На этот день встреч нет.'
            }
          />
        </div>
      </section>
      {layout.mobile && (
        <UndatedToggle
          count={view.counts?.undated}
          selected={view.selection.undated}
          onToggle={() => view.update({ undated: !view.selection.undated })}
        />
      )}
    </div>
  );
};
