import { CircleAlert } from "lucide-react";
import type { Answer } from "@invite/features/respond/model/types";
import { ResponseButtons } from "@invite/features/respond/ui/ResponseButtons";
import styles from "@invite/features/respond/ui/ResponsePanel/ResponsePanel.module.css";

export type ResponsePanelProps = {
  answer: Answer | null;
  pending: Answer | null;
  error: boolean;
  uncertain: boolean;
  last: Answer | null;
  onReply: (answer: Answer) => void;
};
export const ResponsePanel = ({
  answer,
  pending,
  error,
  uncertain,
  last,
  onReply,
}: ResponsePanelProps) => {
  const labels = { going: "Приду", maybe: "Возможно", not_going: "Не смогу" };
  return (
    <section className={styles.panel} aria-label="Ответ на приглашение">
      <ResponseButtons
        answer={answer}
        pending={pending}
        disabled={uncertain}
        onReply={onReply}
      />
      <div
        id="response-status"
        className={styles.status}
        role={error || (uncertain && !pending) ? "alert" : "status"}
      >
        {(error || uncertain) && <CircleAlert size={17} strokeWidth={1.7} />}
        <span>
          {pending
            ? "Сохраняем ответ…"
            : uncertain
              ? "Не удалось подтвердить ответ. Повторите отправку."
              : error
                ? "Не удалось отправить ответ. Попробуйте ещё раз."
                : last
                  ? `Вы ответили «${labels[last]}».`
                  : answer === "maybe"
                    ? "Вы ответили «Возможно»."
                    : answer === "going"
                      ? "Вы участвуете во встрече."
                      : "После ответа «Приду» откроется общий чат."}
        </span>
      </div>
      {uncertain && (
        <button
          type="button"
          className={styles.retry}
          disabled={!!pending}
          onClick={() => onReply("going")}
        >
          Повторить отправку
        </button>
      )}
    </section>
  );
};
