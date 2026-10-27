import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/shared/ui/TimeInput/TimeInput.module.css';
import { useId } from 'react';
import { TextInput } from '@gravity-ui/uikit';
import { Clock } from 'lucide-react';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { designTokens } from '@/shared/config/design-tokens';
import { timeInputValue } from '@/shared/ui/TimeInput/lib/timeInputValue';

export type TimeInputProps = {
  value: string;
  label?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  mobileSheet?: boolean;
  invalid?: boolean;
  required?: boolean;
};

export const TimeInput = ({
  value,
  label = 'Время',
  onChange,
  disabled = false,
  mobileSheet = false,
  invalid = false,
  required = false,
}: TimeInputProps) => {
  const id = useId();
  const mobile = useMobileLayout();

  return (
    <div
      className={styles['control-field']}
      data-sheet={mobileSheet && mobile}
      data-testid="time-input"
    >
      <label htmlFor={id}>{label}</label>
      <TextInput
        id={id}
        type="text"
        value={value}
        onUpdate={(next) => onChange(timeInputValue(next))}
        size="xl"
        placeholder="19:00"
        disabled={disabled}
        {...(invalid ? { validationState: 'invalid' as const } : {})}
        endContent={
          mobileSheet ? (
            <ChatIcon name="clock" size={designTokens.componentMobileFieldIconSize} />
          ) : (
            <Clock size={18} aria-hidden="true" />
          )
        }
        controlProps={{
          inputMode: 'numeric',
          maxLength: 5,
          pattern: '([01][0-9]|2[0-3]):[0-5][0-9]',
          required,
        }}
      />
    </div>
  );
};
