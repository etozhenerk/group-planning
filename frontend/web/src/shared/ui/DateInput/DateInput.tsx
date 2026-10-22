import styles from '@/shared/ui/DateInput/DateInput.module.css';
import { DatePicker } from '@gravity-ui/date-components';
import { MobileProvider } from '@gravity-ui/uikit';
import { useDateInput } from '@/shared/ui/DateInput/hooks/useDateInput';

export type DateInputProps = {
  value: string;
  label?: string;
  timezone: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  hideLabel?: boolean;
  error?: string;
};

export const DateInput = ({
  value,
  label = 'Дата',
  timezone,
  onChange,
  disabled = false,
  invalid = false,
  clearable = true,
  hideLabel = false,
  error = '',
}: DateInputProps) => {
  const field = useDateInput(value, timezone, onChange, disabled);

  return (
    <div className={styles['control-field']}>
      <label
        htmlFor={field.id}
        className={hideLabel ? styles['hidden-label'] : undefined}
      >
        {label}
      </label>
      <div onClick={field.openFromField}>
        <MobileProvider mobile={false}>
          <DatePicker
            id={field.id}
            value={field.value}
            onUpdate={field.change}
            open={field.open}
            onOpenChange={field.setOpen}
            {...(field.today ? { placeholderValue: field.today } : {})}
            format="DD.MM.YYYY"
            timeZone="UTC"
            size="xl"
            placeholder="ДД.ММ.ГГГГ"
            disabled={disabled}
            {...(invalid || error ? { validationState: 'invalid' as const } : {})}
            popupClassName={styles['meeting-date-popup'] ?? ''}
            hasClear={clearable}
            {...(error ? { 'aria-describedby': `${field.id}-error` } : {})}
          />
        </MobileProvider>
      </div>
      {error && (
        <p className={styles['error']} id={`${field.id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
