import type { MeetingDraft, MeetingInput } from '@/entities/meeting';
import { resolveSchedule } from '@/shared/lib/time';

export const patchDraft = (
  value: MeetingDraft,
  original: MeetingDraft,
): Partial<MeetingInput> => {
  if (!value.title.trim()) {
    throw new Error('Введите название встречи.');
  }

  const patch: Partial<MeetingInput> = { title: value.title.trim() };

  if (value.description !== original.description) {
    patch.description = value.description || null;
  }

  if (value.place !== original.place) {
    patch.place = value.place.trim() || null;
  }

  if (
    value.localTime !== original.localTime ||
    value.timezone !== original.timezone ||
    value.timeChoice !== original.timeChoice
  ) {
    Object.assign(
      patch,
      resolveSchedule(value.localTime, value.timezone, value.timeChoice),
    );
    patch.timezone = value.timezone;
  }

  if (value.cover !== undefined) {
    patch.cover = value.cover;
  }

  return patch;
};
