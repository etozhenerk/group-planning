import { useId } from "react";
import { FieldMessage } from "@create/shared/ui/FieldMessage";
import styles from "@create/shared/ui/TextField/TextField.module.css";

export type TextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  maxLength: number;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  multiline?: boolean;
  hint?: string;
};
export const TextField = ({
  label,
  value,
  onChange,
  placeholder,
  maxLength,
  required = false,
  error = "",
  disabled = false,
  multiline = false,
  hint = "",
}: TextFieldProps) => {
  const id = useId();
  const props = {
    id,
    value,
    placeholder,
    maxLength,
    required,
    disabled,
    "aria-invalid": !!error,
    "aria-describedby": `${id}-message`,
  };
  return (
    <div className={styles.field}>
      <label htmlFor={id}>
        {label} {required && <span aria-hidden="true">*</span>}
      </label>
      {multiline ? (
        <textarea
          {...props}
          rows={4}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : (
        <input
          {...props}
          autoComplete="off"
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      <FieldMessage id={`${id}-message`} error={error} hint={hint} />
    </div>
  );
};
