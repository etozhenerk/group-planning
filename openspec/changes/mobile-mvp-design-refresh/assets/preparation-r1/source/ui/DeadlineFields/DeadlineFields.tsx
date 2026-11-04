import { DateInput } from '@/shared/ui/DateInput';
import { TimeInput } from '@/shared/ui/TimeInput';
import { SelectInput } from '@/shared/ui/SelectInput';
import { FieldHint } from '@preview/ui/FieldHint';
import styles from '@preview/ui/DeadlineFields/DeadlineFields.module.css';
export type DeadlineFieldsProps = {
  value: string;
  change: (value: string) => void;
  zone: string;
  choice: '' | 'earlier' | 'later';
  choose: (value: '' | 'earlier' | 'later') => void;
  errors: Record<string, string>;
  disabled: boolean;
};
export const DeadlineFields = ({
  value,
  change,
  zone,
  choice,
  choose,
  errors,
  disabled,
}: DeadlineFieldsProps) => (
  <fieldset className={styles.deadline} disabled={disabled}>
    <legend>Окончание опроса</legend>
    <div className={styles.fields}>
      <DateInput
        compact
        mobileSheet
        value={value.split('T')[0] ?? ''}
        timezone={zone}
        onChange={(date) => change(date + 'T' + (value.split('T')[1] ?? ''))}
        error={errors.date}
        invalid={!!errors.date}
        disabled={disabled}
      />
      <div>
        <TimeInput
          mobileSheet
          required
          value={value.split('T')[1] ?? ''}
          onChange={(time) => change((value.split('T')[0] ?? '') + 'T' + time)}
          invalid={!!errors.time}
          disabled={disabled}
        />
        {errors.time && <FieldHint text={errors.time} />}
      </div>
    </div>
    <small>По московскому времени</small>
    {errors.ambiguous && (
      <SelectInput
        mobileSheet
        label="Повторяющееся время"
        value={choice}
        onChange={(value) =>
          choose(value === 'earlier' || value === 'later' ? value : '')
        }
        options={[
          { value: 'earlier', content: 'До перевода часов' },
          { value: 'later', content: 'После перевода часов' },
        ]}
        disabled={disabled}
      />
    )}
  </fieldset>
);
