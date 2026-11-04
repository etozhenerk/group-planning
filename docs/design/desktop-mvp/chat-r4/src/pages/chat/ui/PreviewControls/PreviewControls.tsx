import styles from "@desktop/pages/chat/ui/PreviewControls/PreviewControls.module.css";

export type PreviewControlsProps = { scenario: string };

export const PreviewControls = ({ scenario }: PreviewControlsProps) => (
  <aside className={styles.controls} aria-label="Управление макетом">
    <span>
      Десктоп · чат r4 <small>Локальные демонстрационные данные</small>
    </span>
    <label>
      Состояние{" "}
      <select
        aria-label="Состояние"
        value={scenario}
        onChange={(event) =>
          window.postMessage(
            { type: "chat-preview-state", value: event.target.value },
            location.origin,
          )
        }
      >
        <option value="ready">Переписка</option>
        <option value="responses">Системные сообщения · ответы</option>
        <option value="failed">Ошибка отправки</option>
        <option value="not-read">Не прочитано</option>
        <option value="unread">Непрочитанное</option>
        <option value="file">Файл в чате</option>
        <option value="own-file">Свой файл</option>
        <option value="photo">Фото в чате</option>
        <option value="poll">Опрос даты</option>
        <option value="place">Опрос места</option>
        <option value="empty">Пустой чат</option>
        <option value="error">Ошибка загрузки</option>
        <option value="loading">Загрузка</option>
        <option value="denied">Доступ закрыт</option>
        <option value="long">Длинное сообщение</option>
      </select>
    </label>
  </aside>
);
