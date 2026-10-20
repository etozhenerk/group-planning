import styles from '@/shared/ui/DateInput/DateInput.module.css';
import { DatePicker } from '@gravity-ui/date-components';
import { MobileProvider } from '@gravity-ui/uikit';
import { useDateInput } from '@/shared/ui/DateInput/hooks/useDateInput';

export type DateInputProps = {
  value: string;
  timezone: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
};

export const DateInput = ({
  value,
  timezone,
  onChange,
  disabled = false,
  invalid = false,
}: DateInputProps) => {
  const field = useDateInput(value, timezone, onChange, disabled);

  return (
    <div className={styles['control-field']}>
      <label htmlFor={field.id}>Дата</label>
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
            {...(invalid ? { validationState: 'invalid' as const } : {})}
            popupClassName={styles['meeting-date-popup'] ?? ''}
            disablePortal
            hasClear
          />
        </MobileProvider>
      </div>
    </div>
  );
};
