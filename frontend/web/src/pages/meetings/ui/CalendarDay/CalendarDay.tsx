import type { CalendarMeeting } from '@/entities/meeting';
import { dayLabel } from '@/pages/meetings/lib/calendarDates';
import { meetingClock } from '@/pages/meetings/lib/meetingLabels';
import styles from '@/pages/meetings/ui/CalendarDay/CalendarDay.module.css';

export type CalendarDayProps = {
  day: string;
  selected: string;
  today: string;
  count: number | undefined;
  preview: CalendarMeeting | undefined;
  onSelect: (day: string) => void;
};

export const CalendarDay = ({
  day,
  selected,
  today,
  count,
  preview,
  onSelect,
}: CalendarDayProps) => {
  return (
    <button
      type="button"
      id={`day-${day}`}
      data-day={day}
      className={styles.day}
      data-outside={day.slice(0, 7) !== selected.slice(0, 7)}
      data-today={day === today}
      data-weekend={[0, 6].includes(new Date(`${day}T12:00:00Z`).getUTCDay())}
      data-event={!!count}
      aria-pressed={day === selected}
      tabIndex={day === selected ? 0 : -1}
      aria-current={day === today ? 'date' : undefined}
      aria-label={`${dayLabel(day)}${count === undefined ? '' : `, встреч: ${count}`}${day === today ? ', сегодня' : ''}${day === selected ? ', выбранный день' : ''}`}
      onClick={() => onSelect(day)}
    >
      <span className={styles.number}>{Number(day.slice(-2))}</span>
      {!!count && (
        <>
          <span aria-hidden="true" className={styles.label}>
            {preview ? `${meetingClock(preview)} ${preview.title}` : `Встреч: ${count}`}
          </span>
          {count > 1 && (
            <span aria-hidden="true" className={styles.additional}>
              +{count - 1}
            </span>
          )}
          <span aria-hidden="true" className={styles.dots}>
            {Array.from({ length: Math.min(count, 3) }, (_, i) => (
              <i key={i} />
            ))}
          </span>
        </>
      )}
    </button>
  );
};
