import { Avatar } from '@/shared/ui/Avatar';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/widgets/meeting-details/ui/ParticipantRow/ParticipantRow.module.css';
import type { Participant } from '@/entities/meeting';
import { answerLabels } from '@/entities/meeting';

export type ParticipantRowProps = { participant: Participant; index: number };

export const ParticipantRow = ({ participant, index }: ParticipantRowProps) => {
  const mobile = useMobileLayout();

  return (
    <li className={styles['participant']} data-mobile={mobile}>
      {mobile ? (
        <Avatar
          name={participant.user.displayName}
          src={participant.user.avatarUrl ?? null}
          size="small"
          tone={
            index % 6 === 2
              ? 'mint'
              : index % 6 === 4
                ? 'blue'
                : index % 6 === 1 || index % 6 === 5
                  ? 'lilac'
                  : 'sand'
          }
        />
      ) : (
        <span className={styles.avatar} data-tone={index % 6} aria-hidden="true">
          {participant.user.displayName.trim().slice(0, 1).toUpperCase()}
        </span>
      )}
      <span className={styles.details}>
        <span>{participant.user.displayName}</span>
        <small>
          {participant.role === 'organizer'
            ? 'Организатор'
            : participant.answer
              ? answerLabels[participant.answer]
              : 'Пока без ответа'}
        </small>
      </span>
    </li>
  );
};
