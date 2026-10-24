import type { Session } from '@/entities/session';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { TaskRecipient } from '@/features/preparation-task/ui/TaskRecipient';
import { useTaskForm } from '@/features/preparation-task/model/useTaskForm';
import styles from '@/features/preparation-task/ui/TaskForm/TaskForm.module.css';

export type TaskFormProps = {
  meeting: string;
  session: Session;
  done: () => void;
  active: boolean;
};

export const TaskForm = ({ meeting, session, done, active }: TaskFormProps) => {
  const form = useTaskForm(meeting, session, done, active);

  return (
    <form onSubmit={form.submit} className={styles.form}>
      <div className={styles.body}>
        <label className={styles.field}>
          Что нужно сделать
          <textarea
            value={form.title}
            onChange={(event) => form.setTitle(event.target.value)}
            disabled={form.locked}
            rows={2}
            required
          />
        </label>
        <TaskRecipient
          people={form.participants}
          error={!!form.people.error}
          retry={() => void form.people.refetch()}
          value={form.recipient}
          onChange={form.setRecipient}
          disabled={form.locked}
          user={session.user.id}
        />
      </div>
      <div className={styles.footer}>
        {form.problem && (
          <p role="alert" className={styles.error}>
            {form.problem}
          </p>
        )}
        <button
          type="submit"
          disabled={
            form.pending ||
            (!form.uncertain && (!form.participants || !!form.people.error))
          }
          aria-busy={form.pending}
          aria-label={form.uncertain ? 'Повторить отправку' : 'Предложить задачу'}
        >
          {form.pending ? (
            <ButtonSpinner />
          ) : form.uncertain ? (
            'Повторить отправку'
          ) : (
            'Предложить задачу'
          )}
        </button>
      </div>
    </form>
  );
};
