import type { Meeting, MeetingDraft, MeetingInput } from '@/entities/meeting/model/types';
import { browserTimezone, editLocalTime, resolveTime } from '@/shared/lib/time';

export const emptyDraft = (): MeetingDraft => {
  return {
    title: '',
    description: '',
    localTime: '',
    timezone: browserTimezone(),
    place: '',
    timeChoice: '',
  };
};

export const draftFor = (meeting: Meeting): MeetingDraft => {
  return {
    title: meeting.title,
    description: meeting.description ?? '',
    localTime: editLocalTime(meeting.startsAt, meeting.timezone),
    timezone: meeting.timezone,
    place: meeting.place ?? '',
    timeChoice: '',
  };
};

export const draftInput = (draft: MeetingDraft): MeetingInput => {
  if (!draft.title.trim()) {
    throw new Error('Введите название встречи.');
  }

  return {
    title: draft.title.trim(),
    description: draft.description || null,
    starts_at: resolveTime(draft.localTime, draft.timezone, draft.timeChoice),
    timezone: draft.timezone,
    place: draft.place.trim() || null,
  };
};
