import type { useTaskControls } from "@/features/preparation-task/model/useTaskControls";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import { TaskNotice } from "@preview/ui/TaskNotice";
import { useChatModel } from "@preview/ChatContext";
import styles from "@preview/ui/TaskConfirmation/TaskConfirmation.module.css";
export type TaskConfirmationProps = {
  action: "cancel" | "decline";
  controls: ReturnType<typeof useTaskControls>;
  back: () => void;
  done: () => void;
};
export const TaskConfirmation = ({
  action,
  controls,
  back,
  done,
}: TaskConfirmationProps) => {
  const m = useChatModel();
  return (
    <div className={styles.confirm}>
      <div className={styles.body}>
        <strong>{m.task.title}</strong>
        <p>
          {action === "cancel"
            ? "Задача останется в истории с отметкой об отмене."
            : "Отказ останется в истории. Передать задачу можно новым предложением."}
        </p>
      </div>
      <div className={styles.footer} data-testid="task-confirm-footer">
        <TaskNotice problem={controls.problem} />
        <button
          className={styles.confirmAction}
          type="button"
          disabled={
            (controls.disabled ||
              !controls.actions.some((item) => item.action === action)) &&
            !controls.retryable
          }
          aria-busy={controls.pending === action}
          onClick={() =>
            controls.retryable
              ? controls.retry(done)
              : controls.act(action, done)
          }
        >
          {controls.pending === action ? (
            <ButtonSpinner />
          ) : controls.retryable ? (
            "Повторить"
          ) : action === "cancel" ? (
            "Отменить задачу"
          ) : (
            "Отказаться"
          )}
        </button>
        <button
          className={styles.keep}
          type="button"
          disabled={!!controls.pending}
          onClick={back}
        >
          Оставить как есть
        </button>
      </div>
    </div>
  );
};
