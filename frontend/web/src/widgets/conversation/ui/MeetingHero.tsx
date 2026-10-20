import type { Meeting } from '@/entities/meeting';
import { MeetingFacts } from '@/entities/meeting';

export type MeetingHeroProps = { meeting: Meeting };

export const MeetingHero = ({ meeting }: MeetingHeroProps) => {
  return (
    <section className="meeting-hero">
      <h1>{meeting.title}</h1>
      {meeting.description && (
        <p className="meeting-description">{meeting.description}</p>
      )}
      <MeetingFacts
        startsAt={meeting.startsAt}
        timezone={meeting.timezone}
        place={meeting.place}
      />
    </section>
  );
};
