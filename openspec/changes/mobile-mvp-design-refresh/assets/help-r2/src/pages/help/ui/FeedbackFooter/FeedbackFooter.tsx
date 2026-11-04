import { TriangleAlert } from "lucide-react";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import type { HelpModel } from "@h/model/useHelpPreview";
import styles from "@h/ui/FeedbackFooter/FeedbackFooter.module.css";
export type FeedbackFooterProps = { model: HelpModel; pinned: boolean };
export const FeedbackFooter = ({ model: m, pinned }: FeedbackFooterProps) => (
  <div className={styles.footer} data-pinned={pinned}>
    {(m.phase === "error" || m.phase === "unknown") && (
      <div className={styles.error} role="alert">
        <TriangleAlert size={19} />
        <span>
          <strong>
            {m.phase === "unknown"
              ? "Отправка не подтверждена"
              : "Не удалось отправить обращение"}
          </strong>
          <small>Текст и скриншот сохранены. Повторите отправку.</small>
        </span>
      </div>
    )}
    <button
      type="submit"
      disabled={m.phase === "sending" || m.reading}
      aria-busy={m.phase === "sending"}
    >
      {m.phase === "sending" && <ButtonSpinner />}
      {m.phase === "sending"
        ? "Отправляем…"
        : m.phase === "error" || m.phase === "unknown"
          ? "Повторить отправку"
          : "Отправить обращение"}
    </button>
  </div>
);
