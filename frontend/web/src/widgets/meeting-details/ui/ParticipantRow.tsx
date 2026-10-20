import type { Participant } from '@/entities/meeting';
import { answerLabels } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/avatar';

export type ParticipantRowProps = { participant: Participant; userId: string };

export const ParticipantRow = ({ participant, userId }: ParticipantRowProps) => {
  return (
    <li className="participant">
      <Avatar name={participant.user.displayName} own={participant.user.id === userId} />
      <span>
        <strong>
          {participant.user.displayName}
          {participant.user.id === userId ? ' · вы' : ''}
        </strong>
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
