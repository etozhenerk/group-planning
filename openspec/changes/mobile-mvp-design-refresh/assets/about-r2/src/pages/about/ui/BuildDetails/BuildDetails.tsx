import type { AboutModel } from "@a/model/useAboutPreview";
import styles from "@a/ui/BuildDetails/BuildDetails.module.css";
export type BuildDetailsProps = { model: AboutModel };
export const BuildDetails = ({ model: m }: BuildDetailsProps) => (
  <dl className={styles.details}>
    <div>
      <dt>Приложение</dt>
      <dd>
        {m.platform === "ios"
          ? "iOS"
          : m.platform === "android"
            ? "Android"
            : "Web"}
      </dd>
    </div>
    <div>
      <dt>Версия</dt>
      <dd>
        {m.mode === "local"
          ? "Локальная сборка"
          : m.mode === "unavailable"
            ? "Недоступна"
            : "0.1.0-rc.2"}
      </dd>
    </div>
    {!["local", "unavailable"].includes(m.mode) && (
      <div>
        <dt>Сборка</dt>
        <dd>42</dd>
      </div>
    )}
  </dl>
);
