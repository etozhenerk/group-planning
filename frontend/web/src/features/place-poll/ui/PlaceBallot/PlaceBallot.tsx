import type { PlacePoll, PlaceVote } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError } from '@/shared/api';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import { usePlaceVote } from '@/features/place-poll/model/usePlaceVote';
import { placePollError } from '@/features/place-poll/model/placePollCopy';
import styles from '@/features/place-poll/ui/PlaceBallot/PlaceBallot.module.css';

export type PlaceBallotProps = { poll: PlacePoll; session: Session };

export const PlaceBallot = ({ poll, session }: PlaceBallotProps) => {
  const action = usePlaceVote(poll.meetingId, poll.id, session);
  const available = poll.canVote && Date.parse(poll.closesAt) > Date.now();
  const conflict = action.error instanceof ApiError && action.error.status === 409;

  return (
    <div>
      <div className={styles.answers}>
        {(['for', 'against'] as PlaceVote[]).map((answer) => {
          const label = answer === 'for' ? 'За' : 'Против';
          const count = answer === 'for' ? poll.votesFor : poll.votesAgainst;

          return available ? (
            <button
              key={answer}
              type="button"
              aria-pressed={poll.myVote === answer}
              aria-label={`${label} · ${count}`}
              aria-busy={action.isPending && action.variables?.answer === answer}
              disabled={action.isPending}
              onClick={() => action.mutate({ answer, revision: poll.myVoteRevision })}
            >
              {action.isPending && action.variables?.answer === answer ? (
                <ButtonSpinner />
              ) : (
                <>
                  {label}
                  <span>{count}</span>
                </>
              )}
            </button>
          ) : (
            <span key={answer}>
              {label} · {count}
            </span>
          );
        })}
      </div>
      {action.error && (
        <div role="alert" className={styles.error}>
          <p>{conflict ? placePollError(action.error) : 'Не удалось сохранить голос.'}</p>
          {available && !conflict && action.variables && (
            <button
              type="button"
              disabled={action.isPending}
              onClick={() => {
                if (action.variables) {
                  action.mutate(action.variables);
                }
              }}
            >
              Повторить
            </button>
          )}
        </div>
      )}
    </div>
  );
};
