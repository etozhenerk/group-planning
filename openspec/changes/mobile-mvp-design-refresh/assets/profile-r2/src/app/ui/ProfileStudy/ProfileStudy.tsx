import { useState } from "react";
import { Stage } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage";
import { Phone } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone";
import styles from "@proto/app/ui/ProfileStudy/ProfileStudy.module.css";
export const ProfileStudy = () => {
  const [state, setState] = useState(
    new URLSearchParams(location.search).get("state") ?? "ready",
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
              title="Новый профиль somewhere"
              src={"frame.html?state=" + state}
            />
          </Phone>
        )}
      </Stage>
      <div className={styles.controls}>
        <label>
          Состояние
          <select value={state} onChange={(e) => setState(e.target.value)}>
            {[
              ["ready", "Профиль"],
              ["personal", "Личные данные"],
              ["missing", "Без фото и контактов"],
              ["loading", "Загрузка"],
              ["error", "Ошибка загрузки"],
              ["long", "Длинное имя"],
              ["logout-error", "Ошибка выхода"],
            ].map(([v, t]) => (
              <option key={v} value={v}>
                {t}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className={styles.note}>
        Мобильный макет · iOS / Android / mobile web
        <br />
        Данные и выход — локальные примеры. Помощь и документы — текущие экраны;
        их редизайн следующим этапом.
      </p>
    </div>
  );
};
