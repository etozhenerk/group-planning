import {
  TaskPresentation as TaskCard,
  TaskCardContent,
} from '@/features/preparation-task';
import { exampleTask } from '@/widgets/onboarding/model/examples';
import { useRef } from 'react';
import styles from '@/widgets/onboarding/ui/OnboardingTask/OnboardingTask.module.css';

export const OnboardingTask = () => {
  const opener = useRef<HTMLButtonElement>(null);

  return (
    <div className={styles.story} inert>
      {[false, true].map((accepted) => {
        const task = accepted
          ? exampleTask
          : {
              ...exampleTask,
              state: 'offered' as const,
              assignee: null,
              canAccept: true,
            };

        return (
          <div key={String(accepted)}>
            <span className={styles.label}>
              {accepted ? 'ДРУГ ПРИНЯЛ ЗАДАЧУ' : 'ПРЕДЛОЖИЛИ ДРУГУ'}
            </span>
            <TaskCard task={task} occurredAt={task.createdAt}>
              <TaskCardContent
                task={task}
                user="lena"
                opener={opener}
                open={() => {}}
                controls={{
                  actions: accepted ? [] : [{ action: 'accept', label: 'Взять на себя' }],
                  disabled: false,
                  pending: undefined,
                  problem: '',
                  retryable: false,
                  retry: () => {},
                  act: () => {},
                }}
              />
            </TaskCard>
          </div>
        );
      })}
    </div>
  );
};
