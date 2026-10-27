import { useMobileLayout } from '@/shared/lib/media';
import type { PreparationAction } from '@/entities/meeting';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import styles from '@/features/preparation-task/ui/TaskActions/TaskActions.module.css';

export type TaskActionsProps = {
  controls: ReturnType<typeof useTaskControls>;
  inline?: boolean;
  confirm?: (action: 'cancel' | 'decline', opener: HTMLButtonElement) => void;
};

export const TaskActions = ({ controls, inline = false, confirm }: TaskActionsProps) => {
  const mobile = useMobileLayout();
  const visible = controls.actions.filter(
    ({ action }) => !inline || action === 'accept' || action === 'complete',
  );

  const act = (action: PreparationAction, opener: HTMLButtonElement) => {
    if (action === 'cancel' || action === 'decline') {
      confirm?.(action, opener);
    } else {
      controls.act(action);
    }
  };

  return (
    <div className={styles.container} data-inline={inline} data-mobile={mobile}>
      <div className={styles.actions}>
        {visible.map(({ action, label }) => (
          <button
            key={action}
            type="button"
            className={
              action === 'cancel'
                ? styles.cancel
                : action === 'decline'
                  ? styles.decline
                  : styles.primary
            }
            disabled={controls.disabled}
            aria-label={label}
            aria-busy={controls.pending === action}
            onClick={(event) => act(action, event.currentTarget)}
          >
            {controls.pending === action ? <ButtonSpinner /> : label}
          </button>
        ))}
      </div>
      {controls.problem && (
        <div role="alert" className={styles.error}>
          <p>{controls.problem}</p>
          {controls.retryable && (
            <button
              type="button"
              disabled={!!controls.pending}
              aria-label="Повторить действие"
              onClick={() => controls.retry()}
            >
              Повторить
            </button>
          )}
        </div>
      )}
    </div>
  );
};
