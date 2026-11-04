import { ChatIcon } from '@/shared/ui/ChatIcon';
import { clockLabel } from '@/shared/lib/time';
import type { PlacePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { PlaceBallot } from '@/features/place-poll/ui/PlaceBallot';
import { placePollStatus } from '@/features/place-poll/model/placePollCopy';
import styles from '@/features/place-poll/ui/PlacePollCard/PlacePollCard.module.css';

export type PlacePollCardProps = {
  poll: PlacePoll | undefined;
  session: Session;
  author: string;
  occurredAt: string;
  zone: string;
  pending?: boolean;
  error?: unknown;
  retry?: () => void;
  now?: number;
};

export const PlacePollCard = ({
  poll,
  session,
  author,
  occurredAt,
  zone,
  pending = false,
  error,
  retry,
  now = Date.now(),
}: PlacePollCardProps) => {
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
          <PlaceBallot poll={poll} session={session} now={now} />
          <div className={styles.footer}>
            {placePollStatus(poll, zone, now)}
            {poll.state === 'open' && ' · место пока прежнее'}
          </div>
        </>
      ) : pending ? (
        <SkeletonRows label="Загрузка опроса" variant="agenda" />
      ) : null}
      {!!error && (
        <div role="alert">
          <p>Не удалось загрузить опрос.</p>
          <button type="button" onClick={retry}>
            Повторить
          </button>
        </div>
      )}
    </section>
  );
};
