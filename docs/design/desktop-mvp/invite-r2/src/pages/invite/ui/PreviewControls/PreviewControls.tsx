import styles from "@invite/pages/invite/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = {
  state: string;
  onChange: (state: string) => void;
};
export const PreviewControls = ({ state, onChange }: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>Превью · приглашение по ссылке · десктоп</span>
    <label>
      Состояние
      <select
        aria-label="Состояние приглашения"
        value={state}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="guest">Гость · до входа</option>
        <option value="ready">После входа</option>
        <option value="declined">Ответ «Не смогу» · подтверждение</option>
        <option value="maybe">Ранее выбрано «Возможно»</option>
        <option value="member">Участие подтверждено</option>
        <option value="organizer">Организатор</option>
        <option value="response-error">Ошибка ответа</option>
        <option value="response-unknown">Ответ не подтверждён</option>
        <option value="auth-error">Ошибка входа</option>
        <option value="auth-cancelled">Вход не завершён</option>
        <option value="closed">Участие закрыто</option>
        <option value="closed-member">Уже участник · приём закрыт</option>
        <option value="no-cover">Без обложки</option>
        <option value="no-time">Время не выбрано</option>
        <option value="no-place">Место не выбрано</option>
        <option value="long">Длинные данные</option>
        <option value="unavailable">Недоступная ссылка</option>
        <option value="load-error">Ошибка загрузки</option>
        <option value="loading">Загрузка</option>
      </select>
    </label>
  </aside>
);
