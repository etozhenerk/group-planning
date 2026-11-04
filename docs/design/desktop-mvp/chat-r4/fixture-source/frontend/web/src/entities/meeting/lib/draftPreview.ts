import type { MeetingDraft } from '@/entities/meeting/model/types';
import { resolveTime } from '@/shared/lib/time';

export const draftPreview = (draft: MeetingDraft): string | null => {
  try {
    return resolveTime(draft.localTime, draft.timezone, draft.timeChoice);
  } catch {
    return null;
  }
};
