import { z } from 'zod';
import { instant, revision, userSchema, uuid } from '@/shared/api/primitives';

export const datePollSchema = z.object({
  id: uuid,
  meeting_id: uuid,
  author: userSchema,
  settings: z.object({
    multiple_answers: z.boolean(),
    allow_revoting: z.boolean(),
    allow_new_options: z.boolean(),
    anonymous: z.boolean(),
    hide_results: z.boolean(),
  }),
  options: z.array(
    z.object({
      id: uuid,
      date: z.iso.date(),
      votes: z.number().int().nonnegative().nullable(),
      voters: z.array(userSchema).nullable(),
    }),
  ),
  state: z.enum([
    'open',
    'awaiting_choice',
    'awaiting_time',
    'applied',
    'no_majority',
    'cancelled',
  ]),
  revision,
  my_vote_revision: revision,
  my_option_ids: z.array(uuid),
  created_at: instant,
  closes_at: instant,
  closed_at: instant.nullable(),
  leader_option_ids: z.array(uuid),
  applied_option_id: uuid.nullable(),
  can_vote: z.boolean(),
  can_add_options: z.boolean(),
  can_resolve: z.boolean(),
});

export type WireDatePoll = z.infer<typeof datePollSchema>;
