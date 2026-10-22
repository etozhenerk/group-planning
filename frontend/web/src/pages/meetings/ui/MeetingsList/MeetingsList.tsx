import { MeetingCard } from '@/entities/meeting';
import type { CalendarMeeting } from '@/entities/meeting';
import { groupMeetings } from '@/pages/meetings/lib/groupMeetings';
import styles from '@/pages/meetings/ui/MeetingsList/MeetingsList.module.css';

export type MeetingsListProps = { meetings: CalendarMeeting[] };

export const MeetingsList = ({ meetings }: MeetingsListProps) => {
  return groupMeetings(meetings).map((group) => (
    <section key={group.title}>
      <h2 className={styles.month}>{group.title}</h2>
      <div className={styles.meetings}>
        {group.meetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} />
        ))}
      </div>
    </section>
  ));
};
