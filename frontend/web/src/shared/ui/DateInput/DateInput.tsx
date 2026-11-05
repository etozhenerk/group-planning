import { dateInputDescription } from '@/shared/ui/DateInput/lib/dateInputDescription';
import { RequiredHint } from '@/shared/ui/RequiredHint';
import { FieldError } from '@/shared/ui/FieldError';
import { RequiredMark } from '@/shared/ui/RequiredMark';
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
  weekday?: boolean;
  required?: boolean;
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
  weekday = false,
  required = false,
}: DateInputProps) => {
  const field = useDateInput(value, timezone, onChange, disabled);
  const mobile = useMobileLayout();
  const descriptionId = dateInputDescription(field.id, required && mobile, error);

  return (
    <div className={styles['control-field']} data-sheet={mobileSheet && mobile}>
      <label
        htmlFor={field.id}
        className={hideLabel ? styles['hidden-label'] : undefined}
      >
        {label} {required && <RequiredMark />}
      </label>
      {compact && mobile ? (
        <DateButton
          mobileSheet={mobileSheet}
          id={field.id}
          label={label}
          value={field.value}
          weekday={weekday}
          today={field.today ?? null}
          disabled={disabled}
          invalid={invalid || !!error}
          descriptionId={descriptionId || undefined}
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
              {...(descriptionId ? { 'aria-describedby': descriptionId } : {})}
            />
          </MobileProvider>
        </div>
      )}
      <RequiredHint id={`${field.id}-required`} required={required} />
      <FieldError id={`${field.id}-error`} error={error} decorated={mobile} />
    </div>
  );
};
