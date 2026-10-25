import { z } from 'zod';

export const uuid = z.uuid();

export const revision = z
  .string()
  .regex(/^(0|[1-9][0-9]*)$/)
  .refine((value) => BigInt(value) <= 18446744073709551615n);

export const instant = z.iso.datetime({ offset: true });

export const answerSchema = z.enum(['going', 'maybe', 'not_going']);

export type Answer = z.infer<typeof answerSchema>;

export const userSchema = z.object({
  id: uuid,
  display_name: z.string(),
  avatar_url: z.string().nullable().optional(),
});

export const sessionSchema = z.object({
  user: userSchema,
  expires_at: instant,
  csrf_token: z.string().nullable(),
});

export const startedSchema = z.object({
  attempt_id: uuid,
  authorization_url: z.url(),
  expires_at: instant,
});

export const invitationLinkSchema = z.object({ invitation_url: z.url() });
