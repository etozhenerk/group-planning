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
              title="Предложение места"
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
            aria-label="Состояние предложения места"
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
            <option value="form">Создание опроса</option>
            <option value="map">Выбор на карте</option><option value="map-error">Ошибка карты</option><option value="empty-form">Пустая форма</option>
            <option value="validation">Обязательное поле</option>
            <option value="form-error">Ошибка создания</option>
            <option value="uncertain">Неизвестный результат</option>
            <option value="active">Другой опрос открыт</option>
            <option value="poll">Голосование</option>
            <option value="vote-error">Ошибка голоса</option>
            <option value="conflict">Голос изменён на другом устройстве</option>
            <option value="applied">Место изменено</option>
            <option value="rejected">Предложение не принято</option>
            <option value="tie">Поровну голосов</option>
            <option value="empty-votes">Никто не проголосовал</option>
            <option value="cancelled">Организатор изменил место</option>
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            document
              .querySelector<HTMLIFrameElement>("iframe")
              ?.contentWindow?.postMessage(
                { type: "place-preview-finish" },
                location.origin,
              )
          }
        >
          Завершить опрос в демо
        </button>
      </div>
      <p className={styles.controls}>
        Макет выбора · подключение Яндекс Карт запланировано; карта и места демонстрационные
      </p>
    </div>
  );
};
