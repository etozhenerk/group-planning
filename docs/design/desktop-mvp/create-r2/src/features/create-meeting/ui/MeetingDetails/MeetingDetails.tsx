import type {
  Draft,
  Errors,
} from "@create/features/create-meeting/model/types";
import { TextField } from "@create/shared/ui/TextField";
import { DateField } from "@create/shared/ui/DateField";
import { TimeField } from "@create/features/create-meeting/ui/TimeField";
import styles from "@create/features/create-meeting/ui/MeetingDetails/MeetingDetails.module.css";

export type MeetingDetailsProps = {
  value: Draft;
  onChange: (value: Draft) => void;
  disabled: boolean;
  errors: Errors;
};
export const MeetingDetails = ({
  value,
  onChange,
  disabled,
  errors,
}: MeetingDetailsProps) => (
  <fieldset className={styles.fields} disabled={disabled}>
    <TextField
      label="Название"
      value={value.title}
      onChange={(title) => onChange({ ...value, title })}
      required
      placeholder="Ужин в пятницу"
      maxLength={120}
      error={errors.title ?? ""}
      disabled={disabled}
    />
    <div className={styles.when}>
      <div className={styles.row}>
        <DateField
          value={value.date}
          onChange={(date) => onChange({ ...value, date })}
          disabled={disabled}
          error={errors.date ?? ""}
        />
        <TimeField
          value={value.time}
          onChange={(time) => onChange({ ...value, time })}
          disabled={disabled}
          error={errors.time ?? ""}
        />
      </div>
      <p>
        Время можно уточнить позже <span>· Москва</span>
      </p>
    </div>
    <TextField
      label="Место"
      value={value.place}
      onChange={(place) => onChange({ ...value, place })}
      placeholder="Адрес, название или ориентир"
      maxLength={500}
      disabled={disabled}
    />
    <TextField
      label="Описание"
      value={value.description}
      onChange={(description) => onChange({ ...value, description })}
      placeholder="Что стоит знать друзьям"
      maxLength={4000}
      disabled={disabled}
      multiline
    />
  </fieldset>
);
