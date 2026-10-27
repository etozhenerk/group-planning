import type { Participant } from '@/entities/meeting';
import type { Ref } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/widgets/meeting-details/ui/ParticipantChips/ParticipantChips.module.css';

export type ParticipantChipsProps = {
  people: Participant[];
  onOpen?: (() => void) | undefined;
  buttonRef?: Ref<HTMLButtonElement>;
  expanded?: boolean | undefined;
  controls?: string | undefined;
  inset?: boolean;
};

export const ParticipantChips = ({
  people,
  onOpen,
  buttonRef,
  expanded,
  controls,
  inset = false,
}: ParticipantChipsProps) => {
  const mobile = useMobileLayout();
  const attending = people.filter(
    (person) => person.role === 'organizer' || person.answer === 'going',
  );

  return (
    <button
      className={[styles.people, inset ? styles.inset : ''].join(' ')}
      data-mobile={mobile}
      type="button"
      onClick={onOpen}
      ref={buttonRef}
      aria-label={`Все участники встречи. Придут: ${attending.length}`}
      aria-expanded={expanded}
      aria-controls={controls}
    >
      {attending.length === 0 && <span>Участников: 0</span>}
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
        <span className={styles.more}>
          {mobile ? '+' : 'ещё '}
          {attending.length - 3}
        </span>
      )}
    </button>
  );
};
