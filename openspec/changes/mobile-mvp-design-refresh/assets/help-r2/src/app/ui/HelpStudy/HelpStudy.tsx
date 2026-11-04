import { useState } from "react";
import { Stage } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage";
import { Phone } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone";
import styles from "@proto/app/ui/HelpStudy/HelpStudy.module.css";
export const HelpStudy = () => {
  const [state, setState] = useState(
    new URLSearchParams(location.search).get("state") ?? "help",
  );
  const [platform, setPlatform] = useState(
    new URLSearchParams(location.search).get("platform") ?? "web",
  );
  return (
    <div className={styles.study}>
      <Stage
        width={390}
        height={815}
        compact={{ below: 390, width: 358, height: 760 }}
        theme="dark"
        fidelity="realistic"
        className={styles.stage ?? ""}
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
              className={styles.frame}
              title="Помощь и поддержка somewhere"
              src={"frame.html?state=" + state + "&platform=" + platform}
            />
          </Phone>
        )}
      </Stage>
      <div className={styles.controls}>
        <label>
          Состояние
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {[
              ["help", "Помощь"],
              ["form", "Обращение"],
              ["form-filled", "Заполнено"],
              ["form-section", "Выбор раздела"],
              ["validation", "Ошибки полей"],
              ["form-error", "Ошибка отправки"],
              ["form-unknown", "Нет подтверждения"],
              ["attachment", "Со скриншотом"],
              ["file-error", "Ошибка файла"],
              ["sending", "Отправка"],
              ["success", "Принято"],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className={styles.controls}>
        <label>
          Платформа
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
          >
            <option value="web">Mobile web</option>
            <option value="ios">iOS</option>
            <option value="android">Android</option>
          </select>
        </label>
      </div>
      <p className={styles.note}>
        Мобильный макет · iOS / Android / mobile web
        <br />
        Отправка в превью имитируется локально. Обращения никуда не уходят.
      </p>
    </div>
  );
};
