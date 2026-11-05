import type { MeetingDraft } from '@/entities/meeting';

export const rebaseDraft = (
  value: MeetingDraft,
  previous: MeetingDraft,
  current: MeetingDraft,
): MeetingDraft => ({
  ...current,
  title: value.title !== previous.title ? value.title : current.title,
  description:
    value.description !== previous.description ? value.description : current.description,
  place: value.place !== previous.place ? value.place : current.place,
  ...(value.localTime !== previous.localTime ||
  value.timezone !== previous.timezone ||
  value.timeChoice !== previous.timeChoice
    ? {
        localTime: value.localTime,
        timezone: value.timezone,
        timeChoice: value.timeChoice,
      }
    : {}),
  cover: value.cover,
});
