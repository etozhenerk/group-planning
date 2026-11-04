import { ChatIcon } from '@/shared/ui/ChatIcon';
import { useMobileLayout } from '@/shared/lib/media';
import { DateInput } from '@/shared/ui/DateInput';
import styles from '@/features/date-poll/ui/PollDatesFields/PollDatesFields.module.css';

export type PollDatesFieldsProps = {
  dates: string[];
  errors: string[];
  zone: string;
  change: (index: number, date: string) => void;
  add: () => void;
  remove: (index: number) => void;
  disabled: boolean;
};

export const PollDatesFields = ({
  dates,
  errors,
  zone,
  change,
  add,
  remove,
  disabled,
}: PollDatesFieldsProps) => {
  const mobile = useMobileLayout();

  return (
    <fieldset className={styles['dates']} data-mobile={mobile} disabled={disabled}>
      <legend>Варианты даты</legend>
      {dates.map((date, index) => (
        <div
          className={[styles['row'], dates.length > 2 ? styles['removable'] : '']
            .filter(Boolean)
            .join(' ')}
          key={index}
        >
          <DateInput
            mobileSheet
            compact
            weekday
            label={`Вариант ${index + 1}`}
            value={date}
            clearable={false}
            hideLabel
            error={errors[index] ?? ''}
            timezone={zone}
            onChange={(value) => change(index, value)}
            disabled={disabled}
          />
          {dates.length > 2 && (
            <button
              type="button"
              className={styles['remove']}
              aria-label={`Удалить вариант ${index + 1}`}
              onClick={() => remove(index)}
              disabled={disabled}
            >
              <ChatIcon name="trash" size={18} aria-hidden="true" />
            </button>
          )}
        </div>
      ))}
      <button
        className={styles['add']}
        type="button"
        onClick={add}
        disabled={disabled || dates.length >= 20}
      >
        <ChatIcon name="plus" size={18} aria-hidden="true" />
        Добавить дату
      </button>
    </fieldset>
  );
};
