import type { Meeting } from '@/entities/meeting';
import { timeLabel } from '@/shared/lib/time';

export const meetingDescription = (meeting: Meeting, mobile: boolean) => {
  const category = new Intl.PluralRules('ru').select(meeting.participantCount);
  const noun =
    category === 'one' ? 'участник' : category === 'few' ? 'участника' : 'участников';

  const people = `${meeting.participantCount} ${noun}`;
  const date = timeLabel(meeting.startsAt, meeting.timezone, meeting.startsOn).replace(
    ' в ',
    ' · ',
  );

  return mobile ? `${date} · ${people}` : `${people} · ${date}`;
};
