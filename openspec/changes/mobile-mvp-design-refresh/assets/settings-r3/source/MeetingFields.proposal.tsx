import { FieldHint } from '@preview/ui/FieldHint';
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
};

export const MeetingFields = ({
  value,
  onChange,
  disabled = false,
  errors = {},
  settings = false,
}: MeetingFieldsProps) => {
  const mobile = useMobileLayout() && settings;
  const description = (
    <label>
      Описание
      <textarea
        maxLength={4000}
        value={value.description}
        onChange={(event) => onChange({ ...value, description: event.target.value })}
        placeholder="Что стоит знать друзьям"
        rows={2}
      />
    </label>
  );

  return (
    <fieldset className={styles['form-fields']} disabled={disabled} data-mobile={mobile}>
      <div className={styles.group}>
        <label>
          Название <span className={styles.required} aria-hidden="true">*</span>
          <input
            required
            maxLength={120}
            value={value.title}
            onChange={(event) => onChange({ ...value, title: event.target.value })}
            aria-invalid={!!errors.title} aria-describedby={errors.title ? "settings-title-error" : undefined}
            autoComplete="off"
            placeholder="Ужин в пятницу"
          />
        </label>
        {errors.title && (
          <FieldHint id="settings-title-error" pullUp text="Введите название встречи"/>
        )}
        {mobile && description}
      </div>
      <div className={styles.group}>
        <MeetingTimeFields
          value={value}
          onChange={onChange}
          errors={errors}
          disabled={disabled}
          mobileSheet={settings}
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
