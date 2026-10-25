import { z } from 'zod';
import { validDay } from '@/shared/lib/time';
import { emptyDraft, preparedCoverSchema } from '@/entities/meeting';
import type { MeetingDraft } from '@/entities/meeting';

const schema = z.object({
  attemptKey: z.uuid().optional(),
  cover: preparedCoverSchema.nullable().optional(),
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

    return parsed.success
      ? parsed.data
      : { ...emptyDraft(), creationEntry: undefined, attemptKey: undefined };
  } catch {
    return { ...emptyDraft(), creationEntry: undefined, attemptKey: undefined };
  }
};

export const readDraft = (
  user: string,
  date: string | null,
  entry: string,
): MeetingDraft => {
  const { creationEntry, attemptKey: _attemptKey, ...draft } = storedDraft(user);
  void _attemptKey;
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

export const storeDraft = (
  user: string,
  value: MeetingDraft,
  entry: string,
  attemptKey?: string,
) => {
  try {
    sessionStorage.setItem(
      `somewhere-draft:${user}`,
      JSON.stringify({ ...value, creationEntry: entry, attemptKey }),
    );
  } catch {
    /* The in-memory draft remains available when browser storage is disabled. */
  }
};

export const removeDraft = (user: string) => {
  sessionStorage.removeItem(`somewhere-draft:${user}`);
};

export const readPendingCreation = (user: string) => {
  const { attemptKey, creationEntry: _entry, ...draft } = storedDraft(user);

  void _entry;

  return attemptKey ? { key: attemptKey, draft } : null;
};
