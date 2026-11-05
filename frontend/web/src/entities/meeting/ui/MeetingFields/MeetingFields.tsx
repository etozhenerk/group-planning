import { MeetingDescription } from '@/entities/meeting/ui/MeetingDescription';
import { useId } from 'react';
import { RequiredMark } from '@/shared/ui/RequiredMark';
import { FieldError } from '@/shared/ui/FieldError';
import styles from '@/entities/meeting/ui/MeetingFields/MeetingFields.module.css';
import { MeetingTimeFields } from '@/entities/meeting/ui/MeetingTimeFields';
import { useMobileLayout } from '@/shared/lib/media';
import type { MeetingDraft } from '@/entities/meeting/model/types';

export type MeetingFieldsProps = {
  value: MeetingDraft;
  onChange: (value: MeetingDraft) => void;
  disabled?: boolean;
  errors?: Record<string, string>;
  settings?: boolean;
  dateRequired?: boolean;
  creation?: boolean;
};

export const MeetingFields = ({
  value,
  onChange,
  disabled = false,
  errors = {},
  settings = false,
  dateRequired = true,
  creation = false,
}: MeetingFieldsProps) => {
  const mobileLayout = useMobileLayout();
  const mobile = mobileLayout && settings;
  const titleError = useId();
  const description = (
    <MeetingDescription
      value={value.description}
      change={(description) => onChange({ ...value, description })}
    />
  );

  return (
    <fieldset
      className={styles['form-fields']}
      disabled={disabled}
      data-mobile={mobile}
      data-create={mobileLayout && (creation || settings)}
    >
      <div className={styles.group}>
        <label>
          Название <RequiredMark />
          <input
            required
            maxLength={120}
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            aria-invalid={!!errors.title}
            aria-describedby={errors.title ? titleError : undefined}
            autoComplete="off"
            placeholder={
              creation && mobileLayout
                ? 'Ужин в пятницу'
                : 'Например, вечер настольных игр'
            }
          />
        </label>
        {errors.title && (
          <FieldError
            decorated={mobileLayout && (creation || settings)}
            id={titleError}
            error={
              mobileLayout
                ? 'Введите название встречи'
                : 'Проверьте название: от 1 до 120 символов.'
            }
          />
        )}
        {mobile && description}
      </div>
      <div className={styles.group}>
        <MeetingTimeFields
          creation={creation || (settings && mobileLayout)}
          value={value}
          onChange={onChange}
          errors={errors}
          disabled={disabled}
          mobileSheet={settings}
          dateRequired={dateRequired}
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
      </div>
      {!mobile && <div className={styles['control-field']}>{description}</div>}
    </fieldset>
  );
};
