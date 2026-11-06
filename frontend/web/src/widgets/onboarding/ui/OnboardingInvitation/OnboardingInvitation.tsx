import { MeetingCard } from '@/entities/meeting';
import { ResponseButtons } from '@/features/respond';
import { meeting, session } from '@/widgets/onboarding/model/artworkExamples';
import styles from '@/widgets/onboarding/ui/OnboardingInvitation/OnboardingInvitation.module.css';

export const OnboardingInvitation = () => (
  <div className={styles.invitation} inert>
    <div className={styles.photo}>
      <img src="/onboarding/boardgame.png" alt="" />
    </div>
    <div className={styles.card}>
      <MeetingCard meeting={{ ...meeting, coverUrl: null }} user="misha" />
    </div>
    <div className={styles.response}>
      <ResponseButtons
        session={session}
        id={meeting.id}
        title={meeting.title}
        preview={{
          meetingId: meeting.id,
          title: meeting.title,
          description: null,
          startsAt: meeting.startsAt,
          startsOn: meeting.startsOn ?? null,
          timezone: meeting.timezone,
          place: meeting.place,
          coverUrl: null,
          myRsvp: 'going',
          myRsvpRevision: '1',
        }}
        expected="1"
        current="going"
        inMeeting
      />
    </div>
  </div>
);
