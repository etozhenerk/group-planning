import { Link } from "react-router";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/FeedbackOptions/FeedbackOptions.module.css";
export type FeedbackOptionsProps = { model: HelpModel };
export const FeedbackOptions = ({ model: m }: FeedbackOptionsProps) => (
  <div className={styles.options}>
    <label className={styles.row}>
      <span>
        <strong>Данные об устройстве</strong>
        <small>
          {m.platform === "web"
            ? "Версия приложения, браузер и размер экрана"
            : "Версия приложения и системы"}
        </small>
      </span>
      <span className={styles.switch}>
        <input
          type="checkbox"
          checked={m.diagnostics}
          onChange={(e) => m.setDiagnostics(e.target.checked)}
        />
        <i aria-hidden="true" />
      </span>
    </label>
    <Link to="/privacy" state={{ returnTo: "/support" }}>
      Политика конфиденциальности
    </Link>
  </div>
);
