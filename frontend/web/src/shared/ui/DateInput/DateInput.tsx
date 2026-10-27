import styles from '@/shared/ui/DateInput/DateInput.module.css';
import { DatePicker } from '@gravity-ui/date-components';
import { MobileProvider } from '@gravity-ui/uikit';
import { useDateInput } from '@/shared/ui/DateInput/hooks/useDateInput';
import { useMobileLayout } from '@/shared/lib/media';
import { DateButton } from '@/shared/ui/DateButton';

export type DateInputProps = {
  value: string;
  label?: string;
  timezone: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  mobileSheet?: boolean;
  invalid?: boolean;
  clearable?: boolean;
  hideLabel?: boolean;
  error?: string;
  compact?: boolean;
};

export const DateInput = ({
  value,
  label = 'Дата',
  timezone,
  onChange,
  disabled = false,
  mobileSheet = false,
  invalid = false,
  clearable = true,
  hideLabel = false,
  error = '',
  compact = false,
}: DateInputProps) => {
  const field = useDateInput(value, timezone, onChange, disabled);
  const mobile = useMobileLayout();

  return (
    <div className={styles['control-field']} data-sheet={mobileSheet && mobile}>
      <label
        htmlFor={field.id}
        className={hideLabel ? styles['hidden-label'] : undefined}
      >
        {label}
      </label>
      {compact && mobile ? (
        <DateButton
          mobileSheet={mobileSheet}
          id={field.id}
          label={label}
          value={field.value}
          today={field.today ?? null}
          disabled={disabled}
          invalid={invalid || !!error}
          clearable={clearable}
          open={field.open}
          setOpen={field.setOpen}
          change={field.change}
        />
      ) : (
        <div
          className={mobileSheet ? styles.chatPicker : undefined}
          onClick={field.openFromField}
        >
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
      )}
      {error && (
        <p className={styles['error']} id={`${field.id}-error`} role="alert">
          {error}
        </p>
      )}
    </div>
  );
};
