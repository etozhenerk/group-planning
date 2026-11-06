import type { MeetingSummary } from '@/entities/meeting/model/types';

export const meetingAlbumPath = (meeting: MeetingSummary) =>
  meeting.memoryPhotoCount
    ? `/meetings/${meeting.id}/memories`
    : `/meetings/${meeting.id}/memories?action=upload`;
