import styles from "@create/pages/creation/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = {
  state: string;
  onChange: (state: string) => void;
};
export const PreviewControls = ({ state, onChange }: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>Превью · создание встречи · десктоп</span>
    <label>
      Состояние
      <select
        aria-label="Состояние формы"
        value={state}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="empty">Пустая форма</option>
        <option value="filled">Заполнено, с фото</option>
        <option value="validation">Ошибки полей</option>
        <option value="error">Ошибка отправки</option>
        <option value="uncertain">Результат неизвестен</option>
      </select>
    </label>
  </aside>
);
