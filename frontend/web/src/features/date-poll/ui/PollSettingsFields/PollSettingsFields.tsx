import { useMobileLayout } from '@/shared/lib/media';
import type { PollSettings } from '@/entities/meeting';
import styles from '@/features/date-poll/ui/PollSettingsFields/PollSettingsFields.module.css';

export type PollSettingsFieldsProps = {
  value: PollSettings;
  onChange: (key: keyof PollSettings, value: boolean) => void;
  disabled: boolean;
};

export const PollSettingsFields = ({
  value,
  onChange,
  disabled,
}: PollSettingsFieldsProps) => {
  const mobile = useMobileLayout();

  return (
    <fieldset
      className={styles['settings']}
      data-mobile={mobile}
      disabled={disabled}
      aria-label="Настройки"
    >
      <label>
        <span>Можно выбрать несколько дат</span>
        <input
          type="checkbox"
          checked={value.multipleAnswers}
          onChange={(event) => onChange('multipleAnswers', event.target.checked)}
        />
      </label>
      <label>
        <span>Можно изменить голос</span>
        <input
          type="checkbox"
          checked={value.allowRevoting}
          onChange={(event) => onChange('allowRevoting', event.target.checked)}
        />
      </label>
      <label>
        <span>Можно добавить дату</span>
        <input
          type="checkbox"
          checked={value.allowNewOptions}
          onChange={(event) => onChange('allowNewOptions', event.target.checked)}
        />
      </label>
      <label>
        <span>Анонимное голосование</span>
        <input
          type="checkbox"
          checked={value.anonymous}
          onChange={(event) => onChange('anonymous', event.target.checked)}
        />
      </label>
      <label>
        <span>Скрывать результаты до завершения</span>
        <input
          type="checkbox"
          checked={value.hideResults}
          onChange={(event) => onChange('hideResults', event.target.checked)}
        />
      </label>
    </fieldset>
  );
};
