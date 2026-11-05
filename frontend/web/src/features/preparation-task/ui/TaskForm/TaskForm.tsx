import type { Session } from '@/entities/session';
import type { DraftExitRegistration } from '@/shared/lib/form';
import { ActionNotice } from '@/shared/ui/ActionNotice';
import { DraftDiscard } from '@/shared/ui/DraftDiscard';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { TaskFormBody } from '@/features/preparation-task/ui/TaskFormBody';
import { TaskRecipientSearch } from '@/features/preparation-task/ui/TaskRecipientSearch';
import { useTaskSurface } from '@/features/preparation-task/ui/TaskForm/hooks/useTaskSurface';
import styles from '@/features/preparation-task/ui/TaskForm/TaskForm.module.css';

export type TaskFormProps = {
  meeting: string;
  session: Session;
  done: () => void;
  active: boolean;
  onRegisterClose?: DraftExitRegistration | undefined;
  onModeChange?: ((title: string) => void) | undefined;
  onDiscard?: ((navigating: boolean) => void) | undefined;
};

export const TaskForm = (props: TaskFormProps) => {
  const { mobile, form, scroll, formRef, selecting, setSelecting, exit } =
    useTaskSurface(props);

  if (exit.confirm) {
    return (
      <DraftDiscard
        text="Текст и адресат задачи не сохранятся."
        stay={exit.stay}
        leave={exit.leave}
      />
    );
  }

  if (mobile && selecting) {
    return (
      <TaskRecipientSearch
        people={form.participants ?? []}
        value={form.recipient}
        user={props.session.user.id}
        choose={(id) => {
          form.setRecipient(id);
          setSelecting(false);
        }}
      />
    );
  }

  const problem = mobile && form.titleError ? '' : form.problem;
  const title = form.uncertain
    ? 'Повторить отправку'
    : mobile && form.failed
      ? 'Попробовать снова'
      : 'Предложить задачу';

  return (
    <form
      noValidate={mobile}
      ref={formRef}
      onSubmit={form.submit}
      className={styles.form}
      data-mobile={mobile}
    >
      <TaskFormBody
        form={form}
        scroll={scroll}
        mobile={mobile}
        user={props.session.user.id}
        classes={styles}
        select={() => setSelecting(true)}
      />
      <div className={styles.footer} data-sticky={scroll.overflow}>
        {problem &&
          (mobile ? (
            <ActionNotice
              title={form.uncertain ? 'Создание задачи не подтверждено' : problem}
              text={
                form.uncertain
                  ? 'Повторите отправку — данные менять не нужно.'
                  : 'Текст и адресат остались в форме.'
              }
            />
          ) : (
            <p role="alert" className={styles.error}>
              {problem}
            </p>
          ))}
        <button
          type="submit"
          disabled={
            form.pending ||
            (!form.uncertain && (!form.participants || !!form.people.error))
          }
          aria-busy={form.pending}
          aria-label={title}
        >
          {form.pending ? <ButtonSpinner /> : title}
        </button>
      </div>
    </form>
  );
};
