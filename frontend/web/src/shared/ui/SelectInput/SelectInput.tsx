import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/shared/ui/SelectInput/SelectInput.module.css';
import { useId } from 'react';
import { Select } from '@gravity-ui/uikit';

export type SelectInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; content: string }[];
  placeholder: string;
  disabled?: boolean;
  mobileSheet?: boolean;
};

export const SelectInput = ({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
  mobileSheet = false,
}: SelectInputProps) => {
  const id = useId();
  const mobile = useMobileLayout();

  return (
    <div className={styles['control-field']} data-sheet={mobileSheet && mobile}>
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
