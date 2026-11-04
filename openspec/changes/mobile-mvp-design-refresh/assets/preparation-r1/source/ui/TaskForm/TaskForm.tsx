import type { Session } from "@/entities/session";
import { Users, ChevronRight } from "lucide-react";
import { Avatar } from "@/shared/ui/Avatar";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import { useTaskForm } from "@preview/useTaskDraft";
import { useChatModel } from "@preview/ChatContext";
import { RecipientPicker } from "@preview/ui/RecipientPicker";
import { FieldHint } from "@preview/ui/FieldHint";
import { TaskNotice } from "@preview/ui/TaskNotice";
import { ExitGuard } from "@preview/ui/ExitGuard";
import styles from "@preview/ui/TaskForm/TaskForm.module.css";
export type TaskFormProps = {
  meeting: string;
  session: Session;
  done: () => void;
  active: boolean;
};
export const TaskForm = ({ meeting, session, done }: TaskFormProps) => {
  const f = useTaskForm(meeting, session, done),
    m = useChatModel(),
    person = f.people.find((person) => person.id === f.recipient);
  if (m.recipientOpen)
    return (
      <RecipientPicker
        value={f.recipient}
        people={f.people}
        choose={f.choose}
      />
    );
  if (m.formGuard) return <ExitGuard stay={f.stay} leave={f.leave} />;
  return (
    <form noValidate className={styles.form} onSubmit={f.submit}>
      <div className={styles.body}>
        <p className={styles.legend}>
          <b aria-hidden="true">*</b> Обязательное поле
        </p>
        <div className={styles.field}>
          <label htmlFor="task-title">
            Что нужно сделать <b aria-hidden="true">*</b>
          </label>
          <textarea
            id="task-title"
            rows={2}
            value={f.title}
            onChange={(event) => f.setTitle(event.target.value)}
            required
            maxLength={200}
            disabled={f.locked}
            placeholder="Например, принести настолки"
            aria-invalid={!!f.fieldError}
            aria-describedby="task-title-error"
          />
          {f.fieldError && (
            <FieldHint id="task-title-error" text={f.fieldError} />
          )}
        </div>
        <div className={styles.field}>
          <label>Кому предложить</label>
          {f.peopleState === "ready" ? (
            <button
              className={styles.recipient}
              type="button"
              disabled={f.locked}
              onClick={() => m.setRecipientOpen(true)}
              aria-label="Выбрать адресата"
            >
              {person ? (
                <Avatar
                  name={person.displayName}
                  src={person.avatarUrl}
                  size="small"
                />
              ) : (
                <span className={styles.any}>
                  <Users size={20} />
                </span>
              )}
              <span>
                {person?.id === "misha"
                  ? "Вам"
                  : (person?.displayName ?? "Любому участнику")}
              </span>
              <ChevronRight size={18} />
            </button>
          ) : f.peopleState === "loading" ? (
            <div className={styles.loading} role="status">
              Загружаем участников…
            </div>
          ) : (
            <div className={styles.peopleError} role="alert">
              <span>Не удалось загрузить участников.</span>
              <button type="button" onClick={f.retryPeople}>
                Повторить
              </button>
            </div>
          )}
          <p className={styles.note}>
            Исполнитель появится после принятия задачи.
          </p>
        </div>
      </div>
      <div className={styles.footer} data-testid="task-form-footer">
        <TaskNotice problem={f.problem} />
        <button
          className={styles.submit}
          type="submit"
          disabled={f.pending || f.peopleState !== "ready"}
          aria-busy={f.pending}
          aria-label={
            f.uncertain
              ? "Повторить отправку"
              : f.problem === "error"
                ? "Попробовать снова"
                : "Предложить задачу"
          }
        >
          {f.pending ? (
            <ButtonSpinner />
          ) : f.uncertain ? (
            "Повторить отправку"
          ) : f.problem === "error" ? (
            "Попробовать снова"
          ) : (
            "Предложить задачу"
          )}
        </button>
      </div>
    </form>
  );
};
