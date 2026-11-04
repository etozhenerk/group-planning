import { usePlacePoll, useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PlacePollCard } from '@/features/place-poll/ui/PlacePollCard';

export type PlacePollRecordProps = {
  meeting: string;
  id: string;
  session: Session;
  author: string;
  occurredAt: string;
};

export const PlacePollRecord = ({
  meeting,
  id,
  session,
  author,
  occurredAt,
}: PlacePollRecordProps) => {
  const query = usePlacePoll(meeting, id, session.user.id);
  const details = useMeeting(meeting, session.user.id);

  if (query.access.denied) {
    return null;
  }

  return (
    <PlacePollCard
      poll={query.data}
      session={session}
      author={author}
      occurredAt={occurredAt}
      zone={details.data?.timezone ?? 'UTC'}
      pending={query.isPending}
      error={query.error}
      retry={() => void query.refetch()}
    />
  );
};
