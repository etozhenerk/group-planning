import { z } from 'zod';
import { userSchema, uuid } from '@/shared/api';

export const reactionSchema = z.object({
  emoji: z.string(),
  count: z.number().int(),
  mine: z.boolean(),
  users: z.array(userSchema),
});

export const entryReactionsSchema = z.object({
  entry_id: uuid,
  reactions: z.array(reactionSchema),
});

export type Reaction = z.infer<typeof reactionSchema>;
