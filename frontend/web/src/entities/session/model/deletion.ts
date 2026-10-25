import { z } from 'zod';

const storageKey = 'somewhere-account-deletion';
const pendingSchema = z.object({
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
  csrf: z.string().nullable(),
});

export type PendingDeletion = z.infer<typeof pendingSchema>;

export const readDeletion = (): PendingDeletion | null => {
  try {
    const value: unknown = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    const result = pendingSchema.safeParse(value);

    return result.success ? result.data : null;
  } catch {
    return null;
  }
};

export const prepareDeletion = (csrf: string | null): PendingDeletion => {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');

  const pending = { token, csrf };
  sessionStorage.setItem(storageKey, JSON.stringify(pending));

  return pending;
};

export const clearDeletion = (): void => sessionStorage.removeItem(storageKey);

export const clearPrivateStorage = (): void => {
  for (const key of Object.keys(sessionStorage)) {
    if (
      (key.startsWith('somewhere-') || key.startsWith('meeting-calendar:')) &&
      key !== storageKey
    ) {
      sessionStorage.removeItem(key);
    }
  }

  clearDeletion();
};
