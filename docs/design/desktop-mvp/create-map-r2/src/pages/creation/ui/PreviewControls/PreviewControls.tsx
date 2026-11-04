import styles from "@future/pages/creation/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = {
  mapState: string;
  onMapState: (value: string) => void;
  state: string;
  onChange: (state: string) => void;
};
export const PreviewControls = ({
  state,
  onChange,
  mapState,
  onMapState,
}: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>Будущий этап · Яндекс Карты</span>
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
    <label>
      Карта
      <select
        aria-label="Состояние карты"
        value={mapState}
        onChange={(event) => onMapState(event.target.value)}
      >
        <option value="ready">Выбор места</option>
        <option value="loading">Загрузка карты</option>
        <option value="error">Карта недоступна</option>
        <option value="empty">Ничего не найдено</option>
        <option value="search-error">Ошибка поиска</option>
      </select>
    </label>
    <a href="../desktop-create-r2/preview.html?state=filled">Стартовая форма</a>
  </aside>
);
