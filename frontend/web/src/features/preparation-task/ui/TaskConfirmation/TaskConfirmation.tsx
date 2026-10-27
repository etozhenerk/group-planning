import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import styles from '@/features/preparation-task/ui/TaskConfirmation/TaskConfirmation.module.css';

export type TaskConfirmationProps = {
  action: 'cancel' | 'decline';
  controls: ReturnType<typeof useTaskControls>;
  back: () => void;
  done: () => void;
};

export const TaskConfirmation = ({
  action,
  controls,
  back,
  done,
}: TaskConfirmationProps) => (
  <div className={styles.confirmation}>
    <p>
      {action === 'cancel'
        ? 'Задача останется в истории с отметкой об отмене. Новый исполнитель не назначится.'
        : 'Отказ останется в истории. Передать задачу можно новым предложением.'}
    </p>
    {controls.problem && (
      <p role="alert" className={styles.error}>
        {controls.problem}
      </p>
    )}
    <button
      type="button"
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
