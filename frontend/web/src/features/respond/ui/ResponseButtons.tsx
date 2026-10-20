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
  onSaved?: () => void;
};

export const ResponseButtons = ({
  session,
  id,
  token,
  expected,
  current,
  onSaved,
}: ResponseButtonsProps) => {
  const action = useRespond(session, id, token, expected);
  const confirmed = action.saved ?? current;

  return (
    <div className="stack">
      <div className="response-buttons">
        {(['going', 'maybe', 'not_going'] as const).map((answer) => (
          <button
            key={answer}
            type="button"
            className={answer === 'going' ? 'primary' : ''}
            aria-pressed={confirmed === answer}
            disabled={action.mutation.isPending}
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
        <p role="alert" className="error">
          {errorText(action.mutation.error)}
        </p>
      )}
      {action.saved && <p role="status">Вы ответили «{answerLabels[action.saved]}».</p>}
      {confirmed === 'going' && (
        <Link className="button primary" to={`/meetings/${id}`}>
          Открыть встречу
        </Link>
      )}
      {confirmed !== 'going' && (
        <p className="muted">После ответа «Приду» откроется общий чат.</p>
      )}
    </div>
  );
};
