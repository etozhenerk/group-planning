import { ChevronLeft, ChevronRight } from 'lucide-react';
import { designTokens } from '@/shared/config/design-tokens';
import { useMobileLayout, useMediaQuery } from '@/shared/lib/media';
import type { CalendarPage } from '@/entities/meeting/model/calendar';
import { CalendarDay } from '@/entities/meeting/ui/CalendarDay';
import {
  monthDays,
  monthLabel,
  changeMonth,
  today,
} from '@/entities/meeting/lib/calendarDates';
import { useCalendarKeyboard } from '@/entities/meeting/ui/CalendarGrid/hooks/useCalendarKeyboard';
import styles from '@/entities/meeting/ui/CalendarGrid/CalendarGrid.module.css';

export type CalendarGridProps = {
  day: string;
  page: CalendarPage | undefined;
  onSelect: (day: string) => void;
  currentDay?: string;
};

export const CalendarGrid = ({
  day,
  page,
  onSelect,
  currentDay = today(),
}: CalendarGridProps) => {
  const mobile = useMobileLayout();
  const narrow = useMediaQuery(`(width <= ${designTokens.breakpointChatNarrowWidth})`);
  const keyboard = useCalendarKeyboard(day, onSelect);

  return (
    <section
      aria-label="Календарь встреч"
      className={styles.calendar}
      data-mobile={mobile}
      data-narrow={narrow}
    >
      <div className={styles.header}>
        <h2>{monthLabel(day)}</h2>
        <div className={styles.buttons}>
          <button
            type="button"
            className={styles.today}
            onClick={() => keyboard.selectAndFocus(currentDay)}
          >
            Сегодня
          </button>
          <button
            type="button"
            aria-label="Предыдущий месяц"
            onClick={() => onSelect(changeMonth(day, -1))}
          >
            <ChevronLeft
              size={Number.parseFloat(designTokens.componentCalendarMonthIconSize)}
            />
          </button>
          <button
            type="button"
            aria-label="Следующий месяц"
            onClick={() => onSelect(changeMonth(day, 1))}
          >
            <ChevronRight
              size={Number.parseFloat(designTokens.componentCalendarMonthIconSize)}
            />
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
            today={currentDay}
            mobile={mobile}
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
