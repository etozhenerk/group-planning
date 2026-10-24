import { MapPin } from 'lucide-react';
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
  outgoing: boolean;
};

export const PlacePollCard = ({ meeting, id, session, outgoing }: PlacePollCardProps) => {
  const query = usePlacePoll(meeting, id, session.user.id);
  const details = useMeeting(meeting, session.user.id);

  if (query.access.denied) {
    return null;
  }

  const poll = query.data;

  return (
    <section
      className={[styles.card, outgoing ? styles.outgoing : ''].join(' ')}
      aria-label="Опрос о месте"
    >
      <div className={styles.caption}>
        <MapPin size={18} aria-hidden="true" />
        Предлагает новое место
      </div>
      {poll ? (
        <>
          <h3>{poll.place}</h3>
          <p className={styles.note}>
            {placePollStatus(poll, details.data?.timezone ?? 'UTC')}
          </p>
          <PlaceBallot poll={poll} session={session} />
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
