import type { Meeting, MeetingDraft, MeetingInput } from '@/entities/meeting/model/types';
import { browserTimezone, editLocalTime, resolveSchedule } from '@/shared/lib/time';

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
    localTime: meeting.startsAt
      ? editLocalTime(meeting.startsAt, meeting.timezone)
      : `${meeting.startsOn ?? ''}T`,
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
    ...(draft.cover === undefined ? {} : { cover: draft.cover }),
    title: draft.title.trim(),
    description: draft.description || null,
    ...resolveSchedule(draft.localTime, draft.timezone, draft.timeChoice),
    timezone: draft.timezone,
    place: draft.place.trim() || null,
  };
};
