import { useMobileLayout } from '@/shared/lib/media';
import { useParticipants } from '@/entities/meeting';
import type { Meeting } from '@/entities/meeting';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import { ParticipantRow } from '@/widgets/meeting-details/ui/ParticipantRow';
import { ParticipantChips } from '@/widgets/meeting-details/ui/ParticipantChips';
import styles from '@/widgets/meeting-details/ui/ParticipantList/ParticipantList.module.css';
import { useParticipantExpansion } from '@/widgets/meeting-details/ui/ParticipantList/hooks/useParticipantExpansion';

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
  const mobile = useMobileLayout();
  const people = useParticipants(meeting.id, user);
  const expansion = useParticipantExpansion();
  const expanded = !compact && expansion.expanded;

  return (
    <section
      className={[styles.section, compact ? styles.sidebar : ''].join(' ')}
      data-mobile={mobile}
    >
      <h3>
        {compact
          ? `Кто придёт · ${meeting.participantCount}`
          : mobile
            ? expanded
              ? 'Все ответы'
              : 'Компания'
            : expanded
              ? 'Участники'
              : 'Кто придёт'}
        {mobile && !compact && (
          <span>
            {expanded
              ? (people.data?.length ?? meeting.participantCount)
              : meeting.participantCount}
          </span>
        )}
      </h3>
      {people.isPending && <SkeletonRows label="Загрузка участников" variant="people" />}
      {people.error && (
        <p className={styles.error} role="alert">
          Не удалось получить ответы.{' '}
          <button type="button" onClick={() => void people.refetch()}>
            Повторить
          </button>
        </p>
      )}
      {people.data && (!expanded || mobile) && (
        <ParticipantChips
          people={people.data}
          onOpen={compact ? showAll : () => expansion.change(!expanded)}
          buttonRef={expansion.toggle}
          expanded={compact ? undefined : expanded}
          controls={compact ? undefined : expansion.id}
          inset={!compact}
        />
      )}
      {people.data && expanded && (
        <div id={expansion.id} className={styles.expanded}>
          <button
            className={styles.collapse}
            ref={expansion.collapse}
            type="button"
            onClick={() => expansion.change(false)}
          >
            {mobile ? 'Свернуть список' : 'Скрыть состав'}
          </button>
          <ul className={styles.participants} aria-label="Все участники встречи">
            {people.data.map((participant, index) => (
              <ParticipantRow
                key={participant.user.id}
                participant={participant}
                index={index}
              />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
};
