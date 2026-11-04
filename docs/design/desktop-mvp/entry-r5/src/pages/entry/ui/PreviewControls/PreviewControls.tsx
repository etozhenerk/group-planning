import styles from "@prototype/pages/entry/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = {
  value: string;
  onChange: (value: string) => void;
};

export const PreviewControls = ({ value, onChange }: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>Превью · знакомство и вход · десктоп</span>
    <label>
      Вход
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        <option value="ready">Обычный вид</option>
        <option value="login">Диалог входа</option>
        <option value="busy">Ожидание</option>
        <option value="error">Ошибка</option>
        <option value="cancelled">Вход не завершён</option>
      </select>
    </label>
  </aside>
);
