import { meetingDescription } from '@/pages/meeting/ui/MeetingConversation/lib/meetingDescription';
import type { Meeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { FeedTimeline, useConversationSurface } from '@/widgets/conversation';
import { MeetingHeader } from '@/pages/meeting/ui/MeetingHeader';
import { MemoryBanner } from '@/pages/meeting/ui/MemoryBanner';
import styles from '@/pages/meeting/ui/MeetingConversation/MeetingConversation.module.css';
import { useState } from 'react';
import type { RefObject } from 'react';

export type MeetingConversationProps = {
  meeting: Meeting;
  session: Session;
  hidden: boolean;
  showDetails: () => void;
  detailsTrigger: RefObject<HTMLButtonElement | null>;
};

export const MeetingConversation = ({
  meeting,
  session,
  hidden,
  showDetails,
  detailsTrigger,
}: MeetingConversationProps) => {
  const surface = useConversationSurface(meeting.id, session.user.id);
  const [empty, setEmpty] = useState(true);

  return (
    <main
      id={hidden ? undefined : 'main'}
      className={styles['conversation']}
      hidden={hidden}
      data-mobile={surface.mobile}
    >
      <MeetingHeader
        id={meeting.id}
        title={meeting.title}
        description={meetingDescription(meeting, surface.mobile)}
        organizer={meeting.organizerId === session.user.id}
        showDetails={showDetails}
        detailsTrigger={detailsTrigger}
        empty={empty}
      />
      {meeting.period === 'past' && (
        <MemoryBanner meeting={meeting} user={session.user.id} />
      )}
      <FeedTimeline
        id={meeting.id}
        session={session}
        organizer={meeting.organizerId === session.user.id}
        surface={surface}
        onEmptyChange={setEmpty}
      />
    </main>
  );
};
