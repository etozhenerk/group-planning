import { useId } from "react";
import { Clock3 } from "lucide-react";
import { FieldMessage } from "@create/shared/ui/FieldMessage";
import styles from "@create/features/create-meeting/ui/TimeField/TimeField.module.css";

export type TimeFieldProps = {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  error?: string;
};
export const TimeField = ({
  value,
  onChange,
  disabled,
  error = "",
}: TimeFieldProps) => {
  const id = useId();
  return (
    <div className={styles.field}>
      <label htmlFor={id}>Время</label>
      <div className={styles.control} data-invalid={!!error}>
        <input
          id={id}
          value={value}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={`${id}-message`}
          placeholder="19:00"
          inputMode="numeric"
          maxLength={5}
          onChange={(event) =>
            onChange(event.target.value.replace(/[^\d:]/g, ""))
          }
        />
        <Clock3 size={18} strokeWidth={1.7} aria-hidden="true" />
      </div>
      <FieldMessage id={`${id}-message`} error={error} />
    </div>
  );
};
