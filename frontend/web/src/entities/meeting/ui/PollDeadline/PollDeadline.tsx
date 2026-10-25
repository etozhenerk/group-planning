import { DateInput } from '@/shared/ui/DateInput';
import { TimeInput } from '@/shared/ui/TimeInput';
import { SelectInput } from '@/shared/ui/SelectInput';
import { timezoneLabel } from '@/shared/lib/time';
import styles from '@/entities/meeting/ui/PollDeadline/PollDeadline.module.css';

export type PollDeadlineProps = {
  value: string;
  onChange: (value: string) => void;
  zone: string;
  choice: '' | 'earlier' | 'later';
  onChoice: (value: '' | 'earlier' | 'later') => void;
  ambiguous: boolean;
  disabled: boolean;
};

export const PollDeadline = ({
  value,
  onChange,
  zone,
  choice,
  onChoice,
  ambiguous,
  disabled,
}: PollDeadlineProps) => {
  return (
    <fieldset className={styles['deadline']} disabled={disabled}>
      <legend>Опрос завершится</legend>
      <div className={styles['fields']}>
        <DateInput
          compact
          label="Дата"
          value={value.split('T')[0] ?? ''}
          timezone={zone}
          onChange={(date) => onChange(`${date}T${value.split('T')[1] ?? ''}`)}
          disabled={disabled}
        />
        <TimeInput
          label="Время"
          value={value.split('T')[1] ?? ''}
          onChange={(hour) => onChange(`${value.split('T')[0] ?? ''}T${hour}`)}
          required
          disabled={disabled}
        />
      </div>
      <small>{timezoneLabel(zone)}</small>
      {ambiguous && (
        <SelectInput
          label="Повторяющееся время"
          value={choice}
          onChange={(next) =>
            onChoice(next === 'earlier' || next === 'later' ? next : '')
          }
          options={[
            { value: 'earlier', content: 'До перевода часов' },
            { value: 'later', content: 'После перевода часов' },
          ]}
          placeholder="Выберите вариант"
          disabled={disabled}
        />
      )}
    </fieldset>
  );
};
