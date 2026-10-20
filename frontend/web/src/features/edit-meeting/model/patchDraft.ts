import type { MeetingDraft, MeetingInput } from '@/entities/meeting';
import { resolveTime } from '@/shared/lib/time';

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
    patch.starts_at = resolveTime(value.localTime, value.timezone, value.timeChoice);
    patch.timezone = value.timezone;
  }

  return patch;
};
