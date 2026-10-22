import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarPage } from '@/entities/meeting';
import { CalendarDay } from '@/pages/meetings/ui/CalendarDay';
import {
  monthDays,
  monthLabel,
  changeMonth,
  today,
} from '@/pages/meetings/lib/calendarDates';
import { useCalendarKeyboard } from '@/pages/meetings/ui/CalendarGrid/hooks/useCalendarKeyboard';
import styles from '@/pages/meetings/ui/CalendarGrid/CalendarGrid.module.css';

export type CalendarGridProps = {
  day: string;
  page: CalendarPage | undefined;
  onSelect: (day: string) => void;
};

export const CalendarGrid = ({ day, page, onSelect }: CalendarGridProps) => {
  const keyboard = useCalendarKeyboard(day, onSelect);

  return (
    <section aria-label="Календарь встреч" className={styles.calendar}>
      <div className={styles.header}>
        <h2>{monthLabel(day)}</h2>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.today}
            onClick={() => keyboard.selectAndFocus(today())}
          >
            Сегодня
          </button>
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => onSelect(changeMonth(day, -1))}
          >
            <ChevronLeft size={17} />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            onClick={() => onSelect(changeMonth(day, 1))}
          >
            <ChevronRight size={17} />
          </button>
        </div>
      </div>
      <div aria-hidden="true" className={styles.week}>
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div
        key={day.slice(0, 7)}
        className={styles.grid}
        ref={keyboard.grid}
        onKeyDown={keyboard.onKeyDown}
        role="group"
        aria-label="Дни месяца"
      >
        {monthDays(day).map((date) => (
          <CalendarDay
            key={date}
            day={date}
            selected={day}
            today={today()}
            count={
              page
                ? (page.days.find((item) => item.date === date)?.count ?? 0)
                : undefined
            }
            preview={page?.meetings.find((meeting) => meeting.localDate === date)}
            onSelect={onSelect}
          />
        ))}
      </div>
    </section>
  );
};
