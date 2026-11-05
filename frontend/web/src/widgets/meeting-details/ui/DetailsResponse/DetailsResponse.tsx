import { useMobileLayout } from '@/shared/lib/media';
import type { Meeting } from '@/entities/meeting';
import { publicInvitation, useParticipants } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ResponseButtons } from '@/features/respond';
import styles from '@/widgets/meeting-details/ui/DetailsResponse/DetailsResponse.module.css';

export type DetailsResponseProps = { meeting: Meeting; session: Session };

export const DetailsResponse = ({ meeting, session }: DetailsResponseProps) => {
  const mobile = useMobileLayout();
  const people = useParticipants(meeting.id, session.user.id);
  const organizer = people.data?.find((person) => person.role === 'organizer')?.user;

  return (
    <section className={styles.response}>
      {mobile ? (
        <p>Если выбрать «Возможно» или «Не смогу», доступ к чату закроется.</p>
      ) : (
        <h3>Ваш ответ</h3>
      )}
      <ResponseButtons
        session={session}
        id={meeting.id}
        title={meeting.title}
        preview={publicInvitation(meeting, organizer)}
        expected={meeting.myRsvpRevision}
        current={meeting.myRsvp}
        inMeeting
      />
    </section>
  );
};
