import type { MeetingDraft } from '@/entities/meeting/model/types';

export const requiredMeetingErrors = (
  draft: MeetingDraft,
  dateRequired = true,
): Record<string, string> => ({
  ...(!draft.title.trim() ? { title: 'Введите название встречи' } : {}),
  ...(dateRequired && !draft.localTime.split('T')[0]
    ? { starts_on: 'Выберите дату встречи' }
    : {}),
});
