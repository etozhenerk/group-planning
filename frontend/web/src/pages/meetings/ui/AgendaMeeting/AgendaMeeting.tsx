import { MeetingCard } from '@/entities/meeting';
import type { CalendarMeeting } from '@/entities/meeting';
import { useSession } from '@/entities/session';

export type AgendaMeetingProps = { meeting: CalendarMeeting };

export const AgendaMeeting = ({ meeting }: AgendaMeetingProps) => {
  const session = useSession();

  return (
    <div data-testid="agenda-meeting">
      <MeetingCard
        meeting={meeting}
        user={session.data?.user.id ?? ''}
        past={meeting.period === 'past'}
      />
    </div>
  );
};
