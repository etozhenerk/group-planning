import { Stage } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage";
import { Phone } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone";
import styles from "@preview/Study.module.css";
export const Study = () => {
  const initial = new URLSearchParams(location.search).get("state") ?? "ready",
    platform = new URLSearchParams(location.search).get("platform") ?? "web",
    send = (type: string, value: string) =>
      document
        .querySelector<HTMLIFrameElement>("iframe")
        ?.contentWindow?.postMessage({ type, value }, location.origin);
  return (
    <div className={styles.study}>
      <Stage
        width={390}
        height={815}
        compact={{ below: 390, width: 358, height: 760 }}
        theme="dark"
        fidelity="realistic"
        className={styles.stage}
      >
        {(_s, _r, layout) => (
          <Phone
            width={layout === "compact" ? 326 : 358}
            frame="pro"
            dark
            wallpaper="#24252a"
            className={styles.phone}
          >
            <iframe
              title="Вайб встречи"
              src={`frame.html?state=${initial}&platform=${platform}`}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                border: 0,
              }}
            />
          </Phone>
        )}
      </Stage>
      <div className={styles.controls}>
        <label>
          Состояние{" "}
          <select
            aria-label="Состояние вайба"
            defaultValue={initial}
            onChange={(event) => send("vibe-preview-state", event.target.value)}
          >
            <option value="ready">Фотостопка</option>
            <option value="grid">Сетка</option>
            <option value="viewer">Полный просмотр</option>
            <option value="empty">Нет фото</option>
            <option value="loading">Загрузка</option>
            <option value="error">Ошибка альбома</option>
            <option value="photo-error">Недоступное фото</option>
            <option value="upload">Добавить фото</option>
            <option value="upload-selected">Выбранные снимки</option>
            <option value="upload-error">Ошибка добавления</option>
            <option value="partial">Частичная отправка</option>
            <option value="download-error">Ошибка сохранения</option>
            <option value="permission">Нет разрешения · native</option>
            <option value="save-partial">Частичная запись · Android</option>
            <option value="denied">Доступ закрыт</option>
          </select>
        </label>
      </div>
      <div className={styles.controls}>
        <label>
          Платформа{" "}
          <select
            aria-label="Платформа вайба"
            defaultValue={platform}
            onChange={(event) =>
              send("vibe-preview-platform", event.target.value)
            }
          >
            <option value="web">Мобильный web</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </label>
      </div>
      <p className={styles.controls}>
        Макет · добавление фото локальное. Web скачивает демонстрационный ZIP;
        native-сохранение имитируется.
      </p>
    </div>
  );
};
