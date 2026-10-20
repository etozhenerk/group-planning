import { z } from 'zod';
import { emptyDraft } from '@/entities/meeting';
import type { MeetingDraft } from '@/entities/meeting';

const schema = z.object({
  title: z.string(),
  description: z.string(),
  localTime: z.string(),
  timezone: z.string(),
  place: z.string(),
  timeChoice: z.enum(['', 'earlier', 'later']),
});

export const readDraft = (user: string): MeetingDraft => {
  try {
    const parsed = schema.safeParse(
      JSON.parse(sessionStorage.getItem(`somewhere-draft:${user}`) ?? 'null'),
    );

    return parsed.success ? parsed.data : emptyDraft();
  } catch {
    return emptyDraft();
  }
};

export const storeDraft = (user: string, value: MeetingDraft) => {
  try {
    sessionStorage.setItem(`somewhere-draft:${user}`, JSON.stringify(value));
  } catch {
    /* The in-memory draft remains available when browser storage is disabled. */
  }
};

export const removeDraft = (user: string) => {
  sessionStorage.removeItem(`somewhere-draft:${user}`);
};
