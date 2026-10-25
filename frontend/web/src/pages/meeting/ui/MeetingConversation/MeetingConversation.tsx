import { timeLabel } from '@/shared/lib/time';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { FeedTimeline } from '@/widgets/conversation';
import { MeetingHeader } from '@/pages/meeting/ui/MeetingHeader';
import { MemoryBanner } from '@/pages/meeting/ui/MemoryBanner';
import styles from '@/pages/meeting/ui/MeetingConversation/MeetingConversation.module.css';

export type MeetingConversationProps = {
  meeting: Meeting;
  session: Session;
  hidden: boolean;
  showDetails: () => void;
};

export const MeetingConversation = ({
  meeting,
  session,
  hidden,
  showDetails,
}: MeetingConversationProps) => (
  <main
    id={hidden ? undefined : 'main'}
    className={styles['conversation']}
    hidden={hidden}
  >
    <MeetingHeader
      id={meeting.id}
      title={meeting.title}
      description={`${meeting.participantCount} ${new Intl.PluralRules('ru').select(meeting.participantCount) === 'one' ? 'участник' : new Intl.PluralRules('ru').select(meeting.participantCount) === 'few' ? 'участника' : 'участников'} · ${timeLabel(meeting.startsAt, meeting.timezone, meeting.startsOn).replace(' в ', ' · ')}`}
      organizer={meeting.organizerId === session.user.id}
      showDetails={showDetails}
    />
    {meeting.period === 'past' && (
      <MemoryBanner meeting={meeting} user={session.user.id} />
    )}
    <FeedTimeline
      id={meeting.id}
      session={session}
      organizer={meeting.organizerId === session.user.id}
    />
  </main>
);
