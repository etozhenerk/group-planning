import type { ReactNode } from 'react';
import { Attachment } from '@/features/view-media';
import { DatePollCard } from '@/features/date-poll';
import type { FeedEntry } from '@/entities/meeting';
import type { Session } from '@/entities/session';

export type FeedMessageContentProps = {
  entry: FeedEntry;
  session: Session;
  own: boolean;
  children: ReactNode;
};

export const FeedMessageContent = ({
  entry,
  session,
  own,
  children,
}: FeedMessageContentProps) =>
  entry.pollId ? (
    <DatePollCard
      meeting={entry.meetingId}
      id={entry.pollId}
      session={session}
      outgoing={own}
    />
  ) : entry.attachments?.length ? (
    <>
      {entry.attachments.map((media) => (
        <Attachment key={media.id} media={media} user={session.user.id} />
      ))}
      {entry.text &&
        entry.attachments.some(
          (media) => media.kind === 'file' && media.file_name !== entry.text,
        ) &&
        children}
    </>
  ) : (
    children
  );
