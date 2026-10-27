import styles from '@/features/respond/ui/ResponseButtons/ResponseButtons.module.css';
import { Link } from 'react-router';
import { useRespond } from '@/features/respond/model/useRespond';
import type { Session } from '@/entities/session';
import type { Answer } from '@/shared/api';
import { errorText } from '@/shared/api';
import { answerLabels } from '@/entities/meeting';

export type ResponseButtonsProps = {
  session: Session;
  id: string;
  token?: string;
  expected: string;
  current: Answer | null;
  joinDisabledReason?: string | null;
  onSaved?: () => void;
  inMeeting?: boolean;
};

export const ResponseButtons = ({
  session,
  id,
  token,
  expected,
  current,
  onSaved,
  joinDisabledReason = null,
  inMeeting = false,
}: ResponseButtonsProps) => {
  const action = useRespond(session, id, token, expected);
  const confirmed = action.saved ?? current;

  return (
    <div className={[styles.stack, inMeeting ? styles.meeting : ''].join(' ')}>
      <div className={styles['response-buttons']}>
        {(['going', 'maybe', 'not_going'] as const).map((answer) => (
          <button
            key={answer}
            type="button"
            className={answer === 'going' ? styles['primary'] : ''}
            aria-pressed={confirmed === answer}
            disabled={
              action.mutation.isPending ||
              (answer === 'going' && confirmed !== 'going' && !!joinDisabledReason)
            }
            onClick={() =>
              action.mutation.mutate(answer, { onSuccess: () => onSaved?.() })
            }
          >
            {answerLabels[answer]}
          </button>
        ))}
      </div>
      {action.mutation.isPending && <p role="status">Сохраняем ответ…</p>}
      {action.mutation.error && (
        <p role="alert" className={styles['error']}>
          {errorText(action.mutation.error)}
        </p>
      )}
      {action.saved && <p role="status">Вы ответили «{answerLabels[action.saved]}».</p>}
      {!inMeeting && confirmed === 'going' && (
        <Link
          className={[styles['button'], styles['primary']].join(' ')}
          to={`/meetings/${id}`}
        >
          Открыть встречу
        </Link>
      )}
      {joinDisabledReason && confirmed !== 'going' && (
        <p role="status">{joinDisabledReason}</p>
      )}
      {confirmed !== 'going' && !joinDisabledReason && (
        <p className={styles['muted']}>После ответа «Приду» откроется общий чат.</p>
      )}
    </div>
  );
};
