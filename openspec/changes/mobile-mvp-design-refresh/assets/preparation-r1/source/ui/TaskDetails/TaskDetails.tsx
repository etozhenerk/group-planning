import type { PreparationTask } from "@/entities/meeting";
import type { useTaskControls } from "@/features/preparation-task/model/useTaskControls";
import { TaskActions } from "@/features/preparation-task/ui/TaskActions";
import { taskCreatedLabel } from "@/features/preparation-task/ui/TaskDetails/lib/taskCreatedLabel";
import { Avatar } from "@/shared/ui/Avatar";
import { Users, Check, ClipboardList, Minus } from "lucide-react";
import styles from "@preview/ui/TaskDetails/TaskDetails.module.css";
export type TaskDetailsProps = {
  task: PreparationTask;
  user: string;
  controls: ReturnType<typeof useTaskControls>;
  confirm: (action: "cancel" | "decline", opener: HTMLButtonElement) => void;
};
export const TaskDetails = ({
  task,
  user,
  controls,
  confirm,
}: TaskDetailsProps) => {
  const person = task.assignee ?? task.recipient,
    state = {
      offered: "Предложена",
      accepted: "В работе",
      completed: "Выполнено",
      declined: "Отказ от задачи",
      cancelled: "Отменено",
    }[task.state],
    hasActions = controls.actions.length > 0 || !!controls.problem;
  return (
    <div className={styles.details}>
      <div className={styles.body}>
        <div className={styles.status} data-state={task.state}>
          {task.state === "completed" ? (
            <Check size={20} />
          ) : ["cancelled", "declined"].includes(task.state) ? (
            <Minus size={20} />
          ) : (
            <ClipboardList size={20} />
          )}
          <span>{state}</span>
        </div>
        <dl className={styles.facts}>
          <div>
            <dt>Предложение от</dt>
            <dd>
              <Avatar
                name={task.author.displayName}
                src={task.author.avatarUrl}
                size="small"
              />
              {task.author.displayName}
              {task.author.id === user ? " · вы" : ""}
            </dd>
          </div>
          <div>
            <dt>{task.assignee ? "Исполнитель" : "Кому предложено"}</dt>
            <dd>
              {person ? (
                <Avatar
                  name={person.displayName}
                  src={person.avatarUrl}
                  size="small"
                />
              ) : (
                <span className={styles.any}>
                  <Users size={19} />
                </span>
              )}
              {person?.displayName ?? "Любому участнику"}
              {person?.id === user ? " · вы" : ""}
            </dd>
          </div>
          <div>
            <dt>Создано</dt>
            <dd>
              <time dateTime={task.createdAt}>
                {taskCreatedLabel(task.createdAt)}
              </time>
            </dd>
          </div>
        </dl>
        {task.state === "offered" && task.recipient && (
          <p className={styles.note}>
            {task.recipient.id === user
              ? "Примите задачу, если готовы за неё отвечать."
              : "Задачу сможет принять только выбранный участник."}
          </p>
        )}
      </div>
      {hasActions && (
        <div className={styles.footer} data-testid="task-details-footer">
          <TaskActions controls={controls} confirm={confirm} />
        </div>
      )}
    </div>
  );
};
