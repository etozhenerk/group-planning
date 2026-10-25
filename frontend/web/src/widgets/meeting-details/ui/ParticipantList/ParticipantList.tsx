import { useParticipants } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { ParticipantRow } from '@/widgets/meeting-details/ui/ParticipantRow';
import { ParticipantChips } from '@/widgets/meeting-details/ui/ParticipantChips';
import styles from '@/widgets/meeting-details/ui/ParticipantList/ParticipantList.module.css';

export type ParticipantListProps = {
  meeting: Meeting;
  user: string;
  compact: boolean;
  showAll?: (() => void) | undefined;
};

export const ParticipantList = ({
  meeting,
  user,
  compact,
  showAll,
}: ParticipantListProps) => {
  const people = useParticipants(meeting.id, user);

  return (
    <section className={styles.section}>
      <h3>Кто придёт · {meeting.participantCount}</h3>
      {people.isPending && <SkeletonRows label="Загрузка участников" variant="people" />}
      {people.error && (
        <p className={styles.error} role="alert">
          Не удалось получить ответы.{' '}
          <button type="button" onClick={() => void people.refetch()}>
            Повторить
          </button>
        </p>
      )}
      {people.data &&
        (compact ? (
          <ParticipantChips people={people.data} onOpen={showAll} />
        ) : (
          <ul className={styles.participants}>
            {people.data.map((participant) => (
              <ParticipantRow
                key={participant.user.id}
                participant={participant}
                userId={user}
              />
            ))}
          </ul>
        ))}
    </section>
  );
};
