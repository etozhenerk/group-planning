import type { DatePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { usePollAction } from '@/features/date-poll/model/usePollAction';
import { usePollSelection } from '@/features/date-poll/model/usePollSelection';
import { PollOptionRow } from '@/features/date-poll/ui/PollOptionRow';
import { pollError } from '@/features/date-poll/model/pollCopy';
import styles from '@/features/date-poll/ui/PollBallot/PollBallot.module.css';

export type PollBallotProps = { poll: DatePoll; session: Session };

export const PollBallot = ({ poll, session }: PollBallotProps) => {
  const choice = usePollSelection(poll);
  const action = usePollAction(poll.meetingId, poll.id, session);

  return (
    <div>
      {poll.options.map((option) => (
        <PollOptionRow
          key={option.id}
          option={option}
          selected={
            poll.appliedOptionId === option.id ||
            (poll.state === 'open' && choice.selected.includes(option.id))
          }
          editable={poll.canVote}
          multiple={poll.settings.multipleAnswers}
          maximum={Math.max(...poll.options.map((item) => item.votes ?? 0), 1)}
          toggle={() => choice.toggle(option.id)}
          pending={action.isPending}
        />
      ))}
      {poll.canVote && (
        <button
          className={styles['submit']}
          type="button"
          disabled={action.isPending || !choice.changed}
          onClick={() =>
            action.mutate(
              { kind: 'vote', optionIds: choice.selected, revision: poll.myVoteRevision },
              { onSuccess: choice.reset },
            )
          }
        >
          {action.isPending
            ? 'Сохраняем…'
            : poll.myVoteRevision !== '0'
              ? 'Изменить голос'
              : 'Проголосовать'}
        </button>
      )}
      {poll.canVote && poll.settings.allowRevoting && poll.myOptionIds.length > 0 && (
        <button
          type="button"
          disabled={action.isPending}
          onClick={() =>
            action.mutate(
              { kind: 'vote', optionIds: [], revision: poll.myVoteRevision },
              { onSuccess: choice.reset },
            )
          }
        >
          Снять голос
        </button>
      )}
      {action.error && (
        <p className={styles['error']} role="alert">
          {pollError(action.error)}
        </p>
      )}
    </div>
  );
};
