import { useMobileLayout } from '@/shared/lib/media';
import type { Participant } from '@/entities/meeting';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import styles from '@/features/preparation-task/ui/TaskRecipient/TaskRecipient.module.css';

export type TaskRecipientProps = {
  people: Participant[] | undefined;
  error: boolean;
  retry: () => void;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  user: string;
};

export const TaskRecipient = ({
  people,
  error,
  retry,
  value,
  onChange,
  disabled,
  user,
}: TaskRecipientProps) => {
  const mobile = useMobileLayout();

  return (
    <div className={styles.field} data-mobile={mobile}>
      {people ? (
        <label className={styles.field}>
          Кому предложить
          <select
            value={value}
            onChange={(event) => onChange(event.target.value)}
            disabled={disabled || error}
          >
            <option value="">Любому участнику</option>
            {value && !people.some((person) => person.user.id === value) && (
              <option value={value} disabled>
                Участник вышел из встречи
              </option>
            )}
            {people.map((person) => (
              <option key={person.user.id} value={person.user.id}>
                {person.user.id === user ? 'Вы' : person.user.displayName}
              </option>
            ))}
          </select>
        </label>
      ) : !error ? (
        <SkeletonRows label="Загрузка участников" variant="agenda" />
      ) : null}
      {error && (
        <div role="alert">
          <p>Не удалось загрузить участников.</p>
          <button type="button" onClick={retry} disabled={disabled}>
            Повторить
          </button>
        </div>
      )}
    </div>
  );
};
