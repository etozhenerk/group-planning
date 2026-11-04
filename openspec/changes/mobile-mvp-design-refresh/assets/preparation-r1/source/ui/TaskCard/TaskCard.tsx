import type { Session } from "@/entities/session";
import { Avatar } from "@/shared/ui/Avatar";
import { useTaskControls } from "@/features/preparation-task/model/useTaskControls";
import { useTaskPanel } from "@/features/preparation-task/ui/TaskCard/hooks/useTaskPanel";
import { TaskActions } from "@/features/preparation-task/ui/TaskActions";
import { TaskDialog } from "@/features/preparation-task/ui/TaskDialog";
import { ClipboardList, ChevronRight, Users } from "lucide-react";
import { clockLabel } from "@/shared/lib/time";
import { useChatModel } from "@preview/ChatContext";
import styles from "@preview/ui/TaskCard/TaskCard.module.css";
export type TaskCardProps = {
  meeting: string;
  id: string;
  session: Session;
  occurredAt: string;
};
export const TaskCard = ({
  meeting,
  id,
  session,
  occurredAt,
}: TaskCardProps) => {
  const model = useChatModel(),
    task = model.tasks[id],
    controls = useTaskControls(task, meeting, id, session),
    surface = useTaskPanel("task-preview:" + id),
    person = ["completed","declined","cancelled"].includes(task.state)?task.updatedBy:task.assignee ?? task.recipient;
  const status =
    task.state === "completed"
      ? "Выполнено · " + task.updatedBy.displayName
      : task.state === "declined"
        ? "Отказ · " + task.updatedBy.displayName
        : task.state === "cancelled"
          ? "Отменено · " + task.updatedBy.displayName
          : task.state === "accepted"
            ? task.assignee?.id === session.user.id
              ? "Вы выполняете"
              : "Исполняет: " + task.assignee?.displayName
            : task.recipient
              ? task.recipient.id === session.user.id
                ? "Предложено вам"
                : "Предложено: " + task.recipient.displayName
              : "Кто возьмёт?";
  return (
    <>
      <section className={styles.card} aria-label="Задача подготовки">
        <div className={styles.byline}>
          <Avatar
            name={task.author.displayName}
            src={task.author.avatarUrl}
            size="small"
          />
          <span>{task.author.displayName}</span>
          <time>{clockLabel(occurredAt)}</time>
        </div>
        <div className={styles.caption}>
          <ClipboardList size={14} />
          <span>Подготовка</span>
        </div>
        <button
          type="button"
          className={styles.title}
          ref={surface.opener}
          onClick={() => surface.show("details")}
          aria-label={"Подробности задачи «" + task.title + "»"}
        >
          <strong>{task.title}</strong>
          <ChevronRight size={18} />
        </button>
        <div className={styles.status} data-state={task.state}>
          {person ? <Avatar name={person.displayName} src={person.avatarUrl} size="small"/> : <Users size={19}/>}
          <span>{status}</span>
        </div>
        <TaskActions
          controls={surface.panel ? { ...controls, problem: "" } : controls}
          inline
        />
      </section>
      <TaskDialog
        task={task}
        user={session.user.id}
        controls={controls}
        surface={surface}
      />
    </>
  );
};
