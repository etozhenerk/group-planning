import { Link } from 'react-router';
import styles from '@/widgets/meeting-details/ui/DetailsContent/DetailsContent.module.css';
import type { Meeting } from '@/entities/meeting';
import { MeetingFacts, MeetingCover } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ResponseButtons } from '@/features/respond';
import { ShareInvitation } from '@/features/share-invitation';
import { ParticipantList } from '@/widgets/meeting-details/ui/ParticipantList';
import { Images } from 'lucide-react';

export type DetailsContentProps = {
  meeting: Meeting;
  session: Session;
  close: () => void;
  edit: () => void;
  compact?: boolean;
  showAll?: () => void;
};

export const DetailsContent = ({
  meeting,
  session,
  close,
  edit,
  compact = false,
  showAll,
}: DetailsContentProps) => {
  return (
    <div className={[styles['stack'], styles['details-content']].join(' ')}>
      {compact && meeting.coverUrl && (
        <div className={compact ? styles.cover : undefined}>
          <MeetingCover
            url={meeting.coverUrl}
            meeting={meeting.id}
            user={session.user.id}
            fill={compact}
          />
        </div>
      )}
      <MeetingFacts
        compact={compact}
        summary={!compact}
        startsAt={meeting.startsAt}
        startsOn={meeting.startsOn ?? null}
        timezone={meeting.timezone}
        place={meeting.place}
      />
      {meeting.description && (
        <p className={styles['meeting-description']}>{meeting.description}</p>
      )}
      <ParticipantList
        meeting={meeting}
        user={session.user.id}
        compact={compact}
        showAll={showAll}
      />
      {!compact && meeting.organizerId === session.user.id && (
        <ShareInvitation id={meeting.id} subtle />
      )}
      {compact && meeting.period === 'past' && (
        <Link to={`/meetings/${meeting.id}/memories?from=chat`}>
          <Images size={18} />
          Фото встречи
        </Link>
      )}
      {!compact &&
        (meeting.organizerId === session.user.id ? (
          <button type="button" onClick={edit}>
            Изменить настройки
          </button>
        ) : (
          <section>
            <h3>Ваш ответ</h3>
            <ResponseButtons
              session={session}
              id={meeting.id}
              expected={meeting.myRsvpRevision}
              current={meeting.myRsvp}
              onSaved={close}
            />
          </section>
        ))}
    </div>
  );
};
