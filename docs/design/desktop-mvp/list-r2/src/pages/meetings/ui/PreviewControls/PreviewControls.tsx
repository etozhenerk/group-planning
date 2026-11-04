import styles from "@list/pages/meetings/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = {
  value: string;
  onChange: (value: string) => void;
};

export const PreviewControls = ({ value, onChange }: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>Превью · десктоп</span>
    <label>
      Состояние
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {[
          ["ready", "Обычное"],
          ["long", "Длинный текст"],
          ["many-unread", "99+ непрочитанных"],
          ["twenty", "20 встреч в день"],
          ["empty-day", "Пустой день"],
          ["loading", "Загрузка"],
          ["error", "Ошибка загрузки"],
          ["refresh-error", "Ошибка обновления"],
          ["empty", "Нет встреч"],
        ].map(([key, label]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </label>
  </aside>
);
