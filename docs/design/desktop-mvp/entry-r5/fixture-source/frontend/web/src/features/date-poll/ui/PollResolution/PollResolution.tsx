import type { DatePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { dayLabel } from '@/shared/lib/time';
import { usePollAction } from '@/features/date-poll/model/usePollAction';
import { pollError } from '@/features/date-poll/model/pollCopy';
import { PollTimeResolution } from '@/features/date-poll/ui/PollTimeResolution';
import styles from '@/features/date-poll/ui/PollResolution/PollResolution.module.css';

export type PollResolutionProps = { poll: DatePoll; session: Session; zone: string };

export const PollResolution = ({ poll, session, zone }: PollResolutionProps) => {
  const action = usePollAction(poll.meetingId, poll.id, session);

  if (poll.state !== 'awaiting_choice' && poll.state !== 'awaiting_time') {
    return null;
  }

  if (!poll.canResolve) {
    return (
      <p className={styles['waiting']}>
        {poll.state === 'awaiting_choice'
          ? 'Несколько дат набрали поровну голосов. Организатор выберет одну из них.'
          : 'Организатор уточнит время для новой даты.'}
      </p>
    );
  }

  if (poll.state === 'awaiting_time') {
    return <PollTimeResolution poll={poll} session={session} zone={zone} />;
  }

  return (
    <div className={styles['resolution']}>
      <p>Эти даты набрали одинаковое большинство. Выберите день встречи.</p>
      {poll.options
        .filter((option) => poll.leaderOptionIds.includes(option.id))
        .map((option) => (
          <button
            key={option.id}
            type="button"
            disabled={action.isPending}
            onClick={() =>
              action.mutate({
                kind: 'resolve',
                optionId: option.id,
                revision: poll.revision,
              })
            }
          >
            {dayLabel(option.date)}
          </button>
        ))}
      {action.error && (
        <p role="alert" className={styles['error']}>
          {pollError(action.error)}
        </p>
      )}
    </div>
  );
};
