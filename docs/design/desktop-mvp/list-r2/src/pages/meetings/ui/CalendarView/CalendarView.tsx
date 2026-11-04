import { CalendarGrid } from "@/pages/meetings/ui/CalendarGrid";
import {
  agendaLabel,
  meetingCountLabel,
} from "@/pages/meetings/lib/calendarDates";
import type { CalendarMeeting, CalendarPage } from "@/entities/meeting";
import { MeetingCard } from "@list/entities/meeting/ui/MeetingCard/MeetingCard";
import styles from "@list/pages/meetings/ui/CalendarView/CalendarView.module.css";

export type CalendarViewProps = {
  day: string;
  onSelect: (day: string) => void;
  page: CalendarPage;
  meetings: CalendarMeeting[];
  past: boolean;
};

export const CalendarView = ({
  day,
  onSelect,
  page,
  meetings,
  past,
}: CalendarViewProps) => (
  <div className={styles.layout}>
    <div className={styles.calendar}>
      <CalendarGrid day={day} page={page} onSelect={onSelect} />
    </div>
    <section className={styles.agenda} aria-label="Встречи выбранного дня">
      <header>
        <h2>{agendaLabel(day)}</h2>
        <p>{meetingCountLabel(meetings.length)}</p>
      </header>
      <div className={styles.cards}>
        {meetings.length ? (
          meetings.map((meeting) => (
            <MeetingCard key={meeting.id} meeting={meeting} past={past} />
          ))
        ) : (
          <p className={styles.empty}>На этот день встреч нет.</p>
        )}
      </div>
    </section>
  </div>
);
