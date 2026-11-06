import type { ReactNode } from 'react';
import { MeetingCover } from '@/entities/meeting/ui/MeetingCover';

export type MeetingCardCoverProps = {
  url: string | null;
  meeting: string;
  user: string;
  preview?: ReactNode;
};

export const MeetingCardCover = ({
  url,
  meeting,
  user,
  preview,
}: MeetingCardCoverProps) => (
  <>{preview ?? (url && <MeetingCover url={url} meeting={meeting} user={user} fill />)}</>
);
