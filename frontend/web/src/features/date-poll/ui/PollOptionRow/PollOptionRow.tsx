import type { PollOption } from '@/entities/meeting';
import { dayLabel } from '@/shared/lib/time';
import { voteLabel } from '@/features/date-poll/model/pollCopy';
import styles from '@/features/date-poll/ui/PollOptionRow/PollOptionRow.module.css';

export type PollOptionRowProps = {
  option: PollOption;
  selected: boolean;
  editable: boolean;
  multiple: boolean;
  maximum: number;
  toggle: () => void;
  pending: boolean;
};

export const PollOptionRow = ({
  option,
  selected,
  editable,
  multiple,
  maximum,
  toggle,
  pending,
}: PollOptionRowProps) => {
  return (
    <div className={styles['option']} data-selected={selected}>
      <span
        className={styles['fill']}
        style={{
          width: `${option.votes === null ? 0 : (option.votes / Math.max(1, maximum)) * 100}%`,
        }}
        aria-hidden="true"
      />
      <label className={styles['label']}>
        {editable && (
          <input
            type={multiple ? 'checkbox' : 'radio'}
            checked={selected}
            onChange={toggle}
            disabled={pending}
            aria-label={dayLabel(option.date)}
          />
        )}
        <span>
          <strong>{dayLabel(option.date)}</strong>
          <small>{dayLabel(option.date, true)}</small>
        </span>
      </label>
      {option.votes !== null &&
        (option.voters?.length ? (
          <details className={styles['voters']}>
            <summary>{voteLabel(option.votes)}</summary>
            <ul>
              {option.voters.map((user) => (
                <li key={user.id}>{user.displayName}</li>
              ))}
            </ul>
          </details>
        ) : (
          <span className={styles['count']}>{voteLabel(option.votes)}</span>
        ))}
    </div>
  );
};
