import { z } from 'zod';
import { instant, revision, userSchema, uuid } from '@/shared/api/primitives';

export const placePollSchema = z.object({
  id: uuid,
  meeting_id: uuid,
  author: userSchema,
  place: z.string(),
  previous_place: z.string().nullable(),
  state: z.enum(['open', 'applied', 'rejected', 'cancelled']),
  revision,
  my_vote_revision: revision,
  my_vote: z.enum(['for', 'against']).nullable(),
  votes_for: z.number().int().nonnegative(),
  votes_against: z.number().int().nonnegative(),
  created_at: instant,
  closes_at: instant,
  closed_at: instant.nullable(),
  can_vote: z.boolean(),
});

export type WirePlacePoll = z.infer<typeof placePollSchema>;
