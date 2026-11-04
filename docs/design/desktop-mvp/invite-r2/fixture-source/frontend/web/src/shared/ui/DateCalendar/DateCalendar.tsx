import { Calendar, DateField } from '@gravity-ui/date-components';
import type { DateTime } from '@gravity-ui/date-utils';
import styles from '@/shared/ui/DateCalendar/DateCalendar.module.css';

export type DateCalendarProps = {
  label: string;
  value: DateTime | null;
  today: DateTime | null;
  clearable: boolean;
  change: (date: DateTime | null) => void;
  close: () => void;
};

export const DateCalendar = ({
  label,
  value,
  today,
  clearable,
  change,
  close,
}: DateCalendarProps) => (
  <div className={styles.content}>
    <DateField
      value={value}
      onUpdate={change}
      format="DD.MM.YYYY"
      timeZone="UTC"
      size="xl"
      aria-label={label}
      {...(today ? { placeholderValue: today } : {})}
    />
    <Calendar
      value={value}
      timeZone="UTC"
      {...(value
        ? { defaultFocusedValue: value }
        : today
          ? { defaultFocusedValue: today }
          : {})}
      onUpdate={(date) => {
        change(date);
        close();
      }}
    />
    <div className={styles.actions}>
      {clearable && (
        <button
          type="button"
          onClick={() => {
            change(null);
            close();
          }}
        >
          Очистить дату
        </button>
      )}
      <button type="button" onClick={close}>
        Готово
      </button>
    </div>
  </div>
);
