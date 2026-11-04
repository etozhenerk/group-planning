import { useState } from "react";
import { Stage } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/stage";
import { Phone } from "/Users/misha/Documents/Codex/projects/group-planning/.agents/skills/stageshow/kit/phone";
import styles from "@proto/app/ui/AboutStudy/AboutStudy.module.css";
export const AboutStudy = () => {
  const [state, setState] = useState(
    new URLSearchParams(location.search).get("state") ?? "release",
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
              title="О приложении и документы somewhere"
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
              ["release", "Сведения · пример версии"],
              ["local", "Локальная сборка"],
              ["unavailable", "Версия недоступна"],
              ["privacy", "Конфиденциальность"],
              ["privacy-index", "Содержание документа"],
              ["cookies", "Cookie и данные браузера"],
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
        0.1.0-rc.2 и сборка 42 — пример метаданных, не номер нового MVP.
        Документы содержат текущий текст проекта.
      </p>
    </div>
  );
};
