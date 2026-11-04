import { useMobileLayout } from '@/shared/lib/media';
import { useSession } from '@/entities/session';
import { MeetingCard } from '@/entities/meeting';
import type { CalendarMeeting } from '@/entities/meeting';
import { groupMeetings } from '@/pages/meetings/lib/groupMeetings';
import styles from '@/pages/meetings/ui/MeetingsList/MeetingsList.module.css';

export type MeetingsListProps = { meetings: CalendarMeeting[] };

export const MeetingsList = ({ meetings }: MeetingsListProps) => {
  const session = useSession();
  const mobile = useMobileLayout();

  return groupMeetings(meetings).map((group) => (
    <section key={group.title}>
      <h2 className={styles.month} data-mobile={mobile}>
        {mobile ? group.mobileTitle : group.title}
      </h2>
      <div className={styles.meetings} data-mobile={mobile}>
        {group.meetings.map((meeting) => (
          <MeetingCard
            key={meeting.id}
            meeting={meeting}
            past={meeting.period === 'past'}
            user={session.data?.user.id ?? ''}
          />
        ))}
      </div>
    </section>
  ));
};
