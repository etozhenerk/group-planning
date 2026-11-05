import { useMobileLayout } from '@/shared/lib/media';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { ActionNotice } from '@/shared/ui/ActionNotice';
import type { TaskConfirmationProps } from '@/features/preparation-task/ui/TaskConfirmation/TaskConfirmation';
import styles from '@/features/preparation-task/ui/TaskConfirmationActions/TaskConfirmationActions.module.css';

export type TaskConfirmationActionsProps = Omit<TaskConfirmationProps, 'title'>;

export const TaskConfirmationActions = ({
  action,
  controls,
  back,
  done,
}: TaskConfirmationActionsProps) => {
  const mobile = useMobileLayout();

  return (
    <div className={styles.actions} data-mobile={mobile}>
      {controls.problem &&
        (mobile ? (
          <ActionNotice title={controls.problem} text="" />
        ) : (
          <p role="alert" className={styles.error}>
            {controls.problem}
          </p>
        ))}
      <button
        type="button"
        className={styles.primary}
        disabled={
          (controls.disabled ||
            !controls.actions.some((available) => available.action === action)) &&
          !controls.retryable
        }
        aria-busy={controls.pending === action}
        onClick={() =>
          controls.retryable ? controls.retry(done) : controls.act(action, done)
        }
      >
        {controls.pending === action ? (
          <ButtonSpinner />
        ) : controls.retryable ? (
          'Повторить'
        ) : action === 'cancel' ? (
          'Отменить задачу'
        ) : (
          'Отказаться'
        )}
      </button>
      <button
        type="button"
        className={styles.keep}
        disabled={!!controls.pending}
        onClick={back}
      >
        Оставить как есть
      </button>
    </div>
  );
};
