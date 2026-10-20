import type { Meeting } from '@/entities/meeting';
import { MeetingFacts, useParticipants } from '@/entities/meeting';
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
    <div className="stack">
      <MeetingFacts
        startsAt={meeting.startsAt}
        timezone={meeting.timezone}
        place={meeting.place}
      />
      {meeting.description && (
        <p className="meeting-description">{meeting.description}</p>
      )}
      <section>
        <h3>Компания · {meeting.participantCount}</h3>
        {people.isPending && <p role="status">Загружаем ответы…</p>}
        {people.error && (
          <p className="error" role="alert">
            Не удалось получить ответы.{' '}
            <button type="button" onClick={() => void people.refetch()}>
              Повторить
            </button>
          </p>
        )}
        {people.data && (
          <ul className="participants">
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
