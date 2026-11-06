import type { ReactNode } from 'react';
import type { MeetingSummary } from '@/entities/meeting/model/types';
import { MemoryPreview } from '@/entities/meeting/ui/MemoryPreview';

export type MeetingAlbumContentProps = {
  meeting: MeetingSummary;
  user: string;
  fallback: ReactNode;
};

export const MeetingAlbumContent = ({
  meeting,
  user,
  fallback,
}: MeetingAlbumContentProps) => (
  <>
    {meeting.memoryPreview?.length ? (
      <MemoryPreview photos={meeting.memoryPreview} user={user} />
    ) : (
      fallback
    )}
    {meeting.memoryPhotoCount
      ? `Вайб встречи · ${meeting.memoryPhotoCount} фото`
      : 'Добавить фото встречи'}
  </>
);
