import { TriangleAlert } from "lucide-react";
import styles from "@preview/ui/TaskNotice/TaskNotice.module.css";
export type TaskNoticeProps = { problem: string };
export const TaskNotice = ({ problem }: TaskNoticeProps) =>
  problem ? (
    <div className={styles.notice} role="alert">
      <span className={styles.icon}>
        <TriangleAlert size={18} />
      </span>
      <div>
        <strong>
          {problem === "error"
            ? "Не удалось предложить задачу"
            : problem === "uncertain"
              ? "Создание задачи не подтверждено"
              : problem}
        </strong>
        {["error", "uncertain"].includes(problem) && (
          <p>
            {problem === "error"
              ? "Текст и адресат остались в форме."
              : "Повторите отправку — данные менять не нужно."}
          </p>
        )}
      </div>
    </div>
  ) : null;
