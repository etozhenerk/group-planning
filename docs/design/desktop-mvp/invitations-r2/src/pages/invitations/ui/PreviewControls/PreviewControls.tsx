import styles from "@inv/pages/invitations/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = {
  state: string;
  onChange: (state: string) => void;
};

export const PreviewControls = ({ state, onChange }: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>Превью · приглашения · десктоп</span>
    <label>
      Состояние
      <select value={state} onChange={(event) => onChange(event.target.value)}>
        {[
          ["ready", "Обычный список"],
          ["long", "Длинные тексты"],
          ["many", "Длинный список"],
          ["loading", "Загрузка"],
          ["empty", "Нет приглашений"],
          ["error", "Ошибка загрузки"],
          ["refresh-error", "Ошибка обновления"],
          ["answer-error", "Ошибка смены ответа"],
        ].map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </label>
  </aside>
);
