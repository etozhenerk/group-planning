import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import styles from '@/widgets/meeting-details/ui/DetailsContent/DetailsContent.module.css';
import type { Meeting } from '@/entities/meeting';
import { MeetingFacts, MeetingCover, useParticipants } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ResponseButtons } from '@/features/respond';
import { ParticipantRow } from '@/widgets/meeting-details/ui/ParticipantRow';

export type DetailsContentProps = {
  meeting: Meeting;
  session: Session;
  close: () => void;
  edit: () => void;
};

export const DetailsContent = ({
  meeting,
  session,
  close,
  edit,
}: DetailsContentProps) => {
  const people = useParticipants(meeting.id, session.user.id);

  return (
    <div className={[styles['stack'], styles['details-content']].join(' ')}>
      {meeting.coverUrl && (
        <MeetingCover
          url={meeting.coverUrl}
          meeting={meeting.id}
          user={session.user.id}
        />
      )}
      <MeetingFacts
        startsAt={meeting.startsAt}
        startsOn={meeting.startsOn ?? null}
        timezone={meeting.timezone}
        place={meeting.place}
      />
      {meeting.description && (
        <p className={styles['meeting-description']}>{meeting.description}</p>
      )}
      <section>
        <h3>Компания · {meeting.participantCount}</h3>
        {people.isPending && (
          <SkeletonRows label="Загрузка участников" variant="people" />
        )}
        {people.error && (
          <p className={styles['error']} role="alert">
            Не удалось получить ответы.{' '}
            <button type="button" onClick={() => void people.refetch()}>
              Повторить
            </button>
          </p>
        )}
        {people.data && (
          <ul className={styles['participants']}>
            {people.data.map((participant) => (
              <ParticipantRow
                key={participant.user.id}
                participant={participant}
                userId={session.user.id}
              />
            ))}
          </ul>
        )}
      </section>
      {meeting.organizerId === session.user.id ? (
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
      )}
    </div>
  );
};
