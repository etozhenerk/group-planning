import { Stage } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage";
import { Phone } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone";
import styles from "@preview/Study.module.css";
export const Study = () => {
  const initial = new URLSearchParams(location.search).get("state") ?? "form";
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
              title="Подготовка к встрече"
              src={`frame.html?state=${initial}`}
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
            aria-label="Состояние подготовки"
            defaultValue={initial}
            onChange={(event) =>
              document
                .querySelector<HTMLIFrameElement>("iframe")
                ?.contentWindow?.postMessage(
                  { type: "chat-preview-state", value: event.target.value },
                  location.origin,
                )
            }
          >
            <option value="form">Предложить задачу</option>
            <option value="recipient">Выбор адресата</option>
            <option value="empty-form">Пустая форма</option>
            <option value="validation">Обязательное поле</option>
            <option value="people-error">Ошибка участников</option>
            <option value="people-loading">Загрузка участников</option>
            <option value="form-error">Ошибка создания</option>
            <option value="uncertain">Неизвестный результат</option>
            <option value="offered">Общая задача</option>
            <option value="to-me">Предложено вам</option>
            <option value="to-other">Предложено другому</option>
            <option value="self">Предложение себе</option>
            <option value="author">Вы автор</option>
            <option value="accepted">Вы выполняете</option>
            <option value="accepted-other">Выполняет другой</option>
            <option value="completed">Выполнено</option>
            <option value="declined">Отказ</option>
            <option value="cancelled">Отменено</option>
            <option value="action-error">Ошибка действия</option>
            <option value="conflict">Задачу взял другой</option>
            <option value="long">Длинное название</option>
          </select>
        </label>
      </div>
      <p className={styles.controls}>Прототип · задачи и действия локальные</p>
    </div>
  );
};
