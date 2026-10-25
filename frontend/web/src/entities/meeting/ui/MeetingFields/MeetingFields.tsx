import styles from '@/entities/meeting/ui/MeetingFields/MeetingFields.module.css';
import { MeetingTimeFields } from '@/entities/meeting/ui/MeetingTimeFields';
import type { MeetingDraft } from '@/entities/meeting/model/types';

export type MeetingFieldsProps = {
  value: MeetingDraft;
  onChange: (value: MeetingDraft) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
};

export const MeetingFields = ({
  value,
  onChange,
  disabled = false,
  errors = {},
}: MeetingFieldsProps) => {
  return (
    <fieldset className={styles['form-fields']} disabled={disabled}>
      <label>
        Название
        <input
          required
          maxLength={120}
          value={value.title}
          onChange={(event) => onChange({ ...value, title: event.target.value })}
          aria-invalid={!!errors.title}
          autoComplete="off"
          placeholder="Например, вечер настольных игр"
        />
      </label>
      {errors.title && (
        <span className={styles['error']}>Проверьте название: от 1 до 120 символов.</span>
      )}
      <MeetingTimeFields
        value={value}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
      <label>
        Место
        <input
          maxLength={500}
          value={value.place}
          onChange={(event) => onChange({ ...value, place: event.target.value })}
          placeholder="Адрес, название или ориентир"
        />
      </label>
      <div className={styles['control-field']}>
        <label>
          Описание
          <textarea
            maxLength={4000}
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            placeholder="Что стоит знать друзьям"
          />
        </label>
      </div>
    </fieldset>
  );
};
