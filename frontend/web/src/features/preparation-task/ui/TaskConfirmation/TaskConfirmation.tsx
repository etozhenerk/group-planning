import { useMobileLayout } from '@/shared/lib/media';
import type { useTaskControls } from '@/features/preparation-task/model/useTaskControls';
import { TaskConfirmationActions } from '@/features/preparation-task/ui/TaskConfirmationActions';
import styles from '@/features/preparation-task/ui/TaskConfirmation/TaskConfirmation.module.css';

export type TaskConfirmationProps = {
  action: 'cancel' | 'decline';
  controls: ReturnType<typeof useTaskControls>;
  title: string;
  back: () => void;
  done: () => void;
};

export const TaskConfirmation = ({
  action,
  controls,
  title,
  back,
  done,
}: TaskConfirmationProps) => {
  const mobile = useMobileLayout();

  return (
    <div className={styles.confirmation} data-mobile={mobile}>
      <div className={styles.body}>
        {mobile && <strong>{title}</strong>}
        <p>
          {action === 'cancel'
            ? mobile
              ? 'Задача останется в истории с отметкой об отмене.'
              : 'Задача останется в истории с отметкой об отмене. Новый исполнитель не назначится.'
            : 'Отказ останется в истории. Передать задачу можно новым предложением.'}
        </p>
      </div>
      <div className={styles.footer}>
        <TaskConfirmationActions
          action={action}
          controls={controls}
          back={back}
          done={done}
        />
      </div>
    </div>
  );
};
