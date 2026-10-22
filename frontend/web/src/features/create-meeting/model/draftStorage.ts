import { z } from 'zod';
import { validDay } from '@/shared/lib/time';
import { emptyDraft } from '@/entities/meeting';
import type { MeetingDraft } from '@/entities/meeting';

const schema = z.object({
  creationEntry: z.string().optional(),
  title: z.string(),
  description: z.string(),
  localTime: z.string(),
  timezone: z.string(),
  place: z.string(),
  timeChoice: z.enum(['', 'earlier', 'later']),
});

const storedDraft = (user: string) => {
  try {
    const parsed = schema.safeParse(
      JSON.parse(sessionStorage.getItem(`somewhere-draft:${user}`) ?? 'null'),
    );

    return parsed.success ? parsed.data : { ...emptyDraft(), creationEntry: undefined };
  } catch {
    return { ...emptyDraft(), creationEntry: undefined };
  }
};

export const readDraft = (
  user: string,
  date: string | null,
  entry: string,
): MeetingDraft => {
  const { creationEntry, ...draft } = storedDraft(user);
  const day = validDay(date);

  if (!day || creationEntry === entry) {
    return draft;
  }

  return {
    ...draft,
    localTime: `${day}T${draft.localTime.split('T')[1] ?? ''}`,
    timeChoice: '',
  };
};

export const storeDraft = (user: string, value: MeetingDraft, entry: string) => {
  try {
    sessionStorage.setItem(
      `somewhere-draft:${user}`,
      JSON.stringify({ ...value, creationEntry: entry }),
    );
  } catch {
    /* The in-memory draft remains available when browser storage is disabled. */
  }
};

export const removeDraft = (user: string) => {
  sessionStorage.removeItem(`somewhere-draft:${user}`);
};
