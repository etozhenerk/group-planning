import { useId } from 'react';
import { Select } from '@gravity-ui/uikit';

export type SelectInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; content: string }[];
  placeholder: string;
  disabled?: boolean;
};

export const SelectInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: SelectInputProps) => {
  const id = useId();

  return (
    <div className="control-field">
      <label htmlFor={id}>{label}</label>
      <Select
        id={id}
        aria-label={label}
        value={value ? [value] : []}
        onUpdate={(values) => onChange(values[0] ?? '')}
        options={options}
        size="xl"
        width="max"
        popupWidth="fit"
        placeholder={placeholder}
        disabled={disabled}
        disablePortal
      />
    </div>
  );
};
