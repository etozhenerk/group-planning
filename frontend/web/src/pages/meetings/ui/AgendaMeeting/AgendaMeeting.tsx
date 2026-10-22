import { Link } from 'react-router';
import type { CalendarMeeting } from '@/entities/meeting';
import { meetingClock, meetingZone } from '@/pages/meetings/lib/meetingLabels';
import styles from '@/pages/meetings/ui/AgendaMeeting/AgendaMeeting.module.css';

export type AgendaMeetingProps = { meeting: CalendarMeeting };

export const AgendaMeeting = ({ meeting }: AgendaMeetingProps) => {
  return (
    <Link
      to={`/meetings/${meeting.id}`}
      className={styles.meeting}
      data-testid="agenda-meeting"
    >
      <time dateTime={meeting.startsAt ?? undefined}>{meetingClock(meeting)}</time>
      <div>
        <strong>{meeting.title}</strong>
        <small>{meeting.place || 'Место пока не выбрано'}</small>
        {meetingZone(meeting) && <small>{meetingZone(meeting)}</small>}
      </div>
    </Link>
  );
};
