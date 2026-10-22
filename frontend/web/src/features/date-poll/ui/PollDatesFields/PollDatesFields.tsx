import { Plus, X } from 'lucide-react';
import { DateInput } from '@/shared/ui/DateInput';
import styles from '@/features/date-poll/ui/PollDatesFields/PollDatesFields.module.css';

export type PollDatesFieldsProps = {
  dates: string[];
  zone: string;
  change: (index: number, date: string) => void;
  add: () => void;
  remove: (index: number) => void;
  disabled: boolean;
};

export const PollDatesFields = ({
  dates,
  zone,
  change,
  add,
  remove,
  disabled,
}: PollDatesFieldsProps) => {
  return (
    <fieldset className={styles['dates']} disabled={disabled}>
      <legend>Варианты даты</legend>
      {dates.map((date, index) => (
        <div className={styles['row']} key={index}>
          <DateInput
            label={`Вариант ${index + 1}`}
            value={date}
            timezone={zone}
            onChange={(value) => change(index, value)}
            disabled={disabled}
          />
          <button
            type="button"
            className={styles['remove']}
            aria-label={`Удалить вариант ${index + 1}`}
            onClick={() => remove(index)}
            disabled={disabled || dates.length <= 2}
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
      ))}
      <button
        className={styles['add']}
        type="button"
        onClick={add}
        disabled={disabled || dates.length >= 20}
      >
        <Plus size={18} aria-hidden="true" />
        Добавить вариант
      </button>
    </fieldset>
  );
};
