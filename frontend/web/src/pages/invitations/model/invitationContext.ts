import { z } from 'zod';
import type { PublicUser } from '@/shared/api';

const contextSchema = z.object({
  source: z.literal('invitations'),
  organizer: z
    .object({
      id: z.uuid(),
      displayName: z.string(),
      avatarUrl: z.url().nullable().optional(),
    })
    .optional(),
});

export const invitationContext = (organizer: PublicUser | undefined) => ({
  source: 'invitations',
  ...(organizer
    ? {
        organizer: {
          id: organizer.id,
          displayName: organizer.displayName,
          avatarUrl: organizer.avatarUrl ?? null,
        },
      }
    : {}),
});

export const invitationOrganizer = (state: unknown): PublicUser | undefined => {
  const parsed = contextSchema.safeParse(state);

  const organizer = parsed.success ? parsed.data.organizer : undefined;

  return organizer
    ? {
        id: organizer.id,
        displayName: organizer.displayName,
        avatarUrl: organizer.avatarUrl ?? null,
      }
    : undefined;
};
