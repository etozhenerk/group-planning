import { useId } from 'react';
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
  const descriptionHint = useId();

  return (
    <fieldset className="form-fields" disabled={disabled}>
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
        <span className="error">Проверьте название: от 1 до 120 символов.</span>
      )}
      <div className="control-field">
        <label>
          Описание <small>необязательно</small>
          <textarea
            maxLength={4000}
            aria-describedby={descriptionHint}
            value={value.description}
            onChange={(event) => onChange({ ...value, description: event.target.value })}
            placeholder="Что нужно знать друзьям"
          />
        </label>
        <small id={descriptionHint}>Описание увидят все, у кого есть приглашение.</small>
      </div>
      <MeetingTimeFields
        value={value}
        onChange={onChange}
        errors={errors}
        disabled={disabled}
      />
      <label>
        Место <small>можно добавить позже</small>
        <input
          maxLength={500}
          value={value.place}
          onChange={(event) => onChange({ ...value, place: event.target.value })}
          placeholder="Адрес, название или ориентир"
        />
      </label>
    </fieldset>
  );
};
