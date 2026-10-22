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
  return (
    <fieldset className={styles['settings']} disabled={disabled} aria-label="Настройки">
      <label>
        <span>Несколько вариантов</span>
        <input
          type="checkbox"
          role="switch"
          checked={value.multipleAnswers}
          onChange={(event) => onChange('multipleAnswers', event.target.checked)}
        />
      </label>
      <label>
        <span>Можно переголосовать</span>
        <input
          type="checkbox"
          role="switch"
          checked={value.allowRevoting}
          onChange={(event) => onChange('allowRevoting', event.target.checked)}
        />
      </label>
      <label>
        <span>Участники могут добавить дату</span>
        <input
          type="checkbox"
          role="switch"
          checked={value.allowNewOptions}
          onChange={(event) => onChange('allowNewOptions', event.target.checked)}
        />
      </label>
      <label>
        <span>Анонимные голоса</span>
        <input
          type="checkbox"
          role="switch"
          checked={value.anonymous}
          onChange={(event) => onChange('anonymous', event.target.checked)}
        />
      </label>
      <label>
        <span>Скрыть результаты до конца</span>
        <input
          type="checkbox"
          role="switch"
          checked={value.hideResults}
          onChange={(event) => onChange('hideResults', event.target.checked)}
        />
      </label>
    </fieldset>
  );
};
