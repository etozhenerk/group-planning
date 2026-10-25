import type { Participant } from '@/entities/meeting';
import styles from '@/widgets/meeting-details/ui/ParticipantChips/ParticipantChips.module.css';

export type ParticipantChipsProps = {
  people: Participant[];
  onOpen?: (() => void) | undefined;
};

export const ParticipantChips = ({ people, onOpen }: ParticipantChipsProps) => {
  const attending = people.filter(
    (person) => person.role === 'organizer' || person.answer === 'going',
  );

  return (
    <button
      className={styles.people}
      type="button"
      onClick={onOpen}
      aria-label="Все участники встречи"
    >
      {attending.slice(0, 3).map((person) => (
        <span
          className={styles.person}
          key={person.user.id}
          title={person.user.displayName}
        >
          <span aria-hidden="true">
            {person.user.displayName.slice(0, 1).toUpperCase()}
          </span>
          {person.user.displayName}
        </span>
      ))}
      {attending.length > 3 && (
        <span className={styles.more}>ещё {attending.length - 3}</span>
      )}
    </button>
  );
};
