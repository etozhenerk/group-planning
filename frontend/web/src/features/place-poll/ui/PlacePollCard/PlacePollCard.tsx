import { ChatIcon } from '@/shared/ui/ChatIcon';
import { clockLabel } from '@/shared/lib/time';
import { usePlacePoll, useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { PlaceBallot } from '@/features/place-poll/ui/PlaceBallot';
import { placePollStatus } from '@/features/place-poll/model/placePollCopy';
import styles from '@/features/place-poll/ui/PlacePollCard/PlacePollCard.module.css';

export type PlacePollCardProps = {
  meeting: string;
  id: string;
  session: Session;
  author: string;
  occurredAt: string;
};

export const PlacePollCard = ({
  meeting,
  id,
  session,
  author,
  occurredAt,
}: PlacePollCardProps) => {
  const query = usePlacePoll(meeting, id, session.user.id);
  const details = useMeeting(meeting, session.user.id);

  if (query.access.denied) {
    return null;
  }

  const poll = query.data;

  return (
    <section className={styles.card} aria-label="Опрос о месте">
      <div className={styles.caption}>
        <ChatIcon name="pin" aria-hidden="true" />
        <span>
          {author} · {clockLabel(occurredAt)}
        </span>
        <span className={styles.status}>Опрос</span>
      </div>
      {poll ? (
        <>
          <h3>{poll.place}</h3>
          {poll.explanation && <p className={styles.explanation}>{poll.explanation}</p>}
          <PlaceBallot poll={poll} session={session} />
          <div className={styles.footer}>
            {placePollStatus(poll, details.data?.timezone ?? 'UTC')}
            {poll.state === 'open' && ' · место пока прежнее'}
          </div>
        </>
      ) : query.isPending ? (
        <SkeletonRows label="Загрузка опроса" variant="agenda" />
      ) : null}
      {query.error && (
        <div role="alert">
          <p>Не удалось загрузить опрос.</p>
          <button type="button" onClick={() => void query.refetch()}>
            Повторить
          </button>
        </div>
      )}
    </section>
  );
};
