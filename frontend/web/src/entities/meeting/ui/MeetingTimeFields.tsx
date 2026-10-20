import type { MeetingDraft } from '@/entities/meeting/model/types';
import { useMeetingTimeFields } from '@/entities/meeting/model/useMeetingTimeFields';
import { DateInput, TimeInput } from '@/shared/ui/date-time';
import { SelectInput } from '@/shared/ui/select';

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
    <div className="time-fields">
      <div className="form-time">
        <DateInput
          value={fields.date}
          timezone={value.timezone}
          onChange={fields.changeDate}
          invalid={!!errors.starts_at}
          disabled={disabled}
        />
        <TimeInput
          value={fields.time}
          onChange={fields.changeTime}
          invalid={!!errors.starts_at}
          disabled={disabled}
        />
      </div>
      <p className="time-zone-note">Время встречи · {fields.zone}</p>
      {errors.starts_at && <span className="error">Проверьте дату и время встречи.</span>}
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
