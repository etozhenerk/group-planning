import styles from '@/entities/meeting/ui/MeetingTimeFields/MeetingTimeFields.module.css';
import type { MeetingDraft } from '@/entities/meeting/model/types';
import { useMeetingTimeFields } from '@/entities/meeting/ui/MeetingTimeFields/hooks/useMeetingTimeFields';
import { DateInput } from '@/shared/ui/DateInput';
import { TimeInput } from '@/shared/ui/TimeInput';
import { SelectInput } from '@/shared/ui/SelectInput';

export type MeetingTimeFieldsProps = {
  value: MeetingDraft;
  onChange: (value: MeetingDraft) => void;
  errors: Record<string, string>;
  disabled?: boolean;
};

export const MeetingTimeFields = ({
  value,
  onChange,
  errors,
  disabled = false,
}: MeetingTimeFieldsProps) => {
  const fields = useMeetingTimeFields(value, onChange);

  return (
    <div className={styles['time-fields']}>
      <div className={styles['form-time']}>
        <DateInput
          compact
          value={fields.date}
          timezone={value.timezone}
          onChange={fields.changeDate}
          invalid={!!errors.starts_at || !!errors.starts_on}
          disabled={disabled}
        />
        <TimeInput
          value={fields.time}
          onChange={fields.changeTime}
          invalid={!!errors.starts_at}
          disabled={disabled}
        />
      </div>
      <p className={styles['time-zone-note']}>
        Время можно уточнить позже · {fields.zone}
      </p>
      {(errors.starts_at || errors.starts_on) && (
        <span className={styles['error']}>Проверьте дату и время встречи.</span>
      )}
      {errors.ambiguous && (
        <SelectInput
          label="Повторяющееся время"
          value={value.timeChoice}
          onChange={fields.changeChoice}
          placeholder="Выберите вариант"
          options={[
            { value: 'earlier', content: 'Ранний вариант — до перевода часов' },
            { value: 'later', content: 'Поздний вариант — после перевода часов' },
          ]}
          disabled={disabled}
        />
      )}
    </div>
  );
};
