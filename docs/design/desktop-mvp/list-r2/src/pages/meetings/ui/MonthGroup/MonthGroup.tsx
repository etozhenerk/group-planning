import type { CalendarMeeting } from "@/entities/meeting";
import { MeetingCard } from "@list/entities/meeting/ui/MeetingCard/MeetingCard";
import styles from "@list/pages/meetings/ui/MonthGroup/MonthGroup.module.css";

export type MonthGroupProps = {
  month: string;
  meetings: CalendarMeeting[];
  past: boolean;
};

export const MonthGroup = ({ month, meetings, past }: MonthGroupProps) => {
  const title =
    month === "undated"
      ? "Без даты"
      : new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(
          new Date(month + "-15T12:00:00Z"),
        );
  return (
    <section className={styles.group}>
      <h2 className={styles.month}>
        {title.charAt(0).toUpperCase() + title.slice(1)}
        <span>{month === "undated" ? "" : month.slice(0, 4)}</span>
      </h2>
      <div className={styles.cards}>
        {meetings.map((meeting) => (
          <MeetingCard key={meeting.id} meeting={meeting} past={past} />
        ))}
      </div>
    </section>
  );
};
