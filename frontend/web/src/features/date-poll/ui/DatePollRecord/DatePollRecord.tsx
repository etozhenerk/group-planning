import { useDatePoll, useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { DatePollCard } from '@/features/date-poll/ui/DatePollCard';

export type DatePollRecordProps = {
  meeting: string;
  id: string;
  session: Session;
  outgoing: boolean;
};

export const DatePollRecord = ({
  meeting,
  id,
  session,
  outgoing,
}: DatePollRecordProps) => {
  const query = useDatePoll(meeting, id, session.user.id);
  const details = useMeeting(meeting, session.user.id);

  if (query.access.denied) {
    return null;
  }

  return (
    <DatePollCard
      poll={query.data}
      session={session}
      outgoing={outgoing}
      zone={details.data?.timezone ?? 'UTC'}
      pending={query.isPending}
      error={query.error}
      retry={() => void query.refetch()}
    />
  );
};
