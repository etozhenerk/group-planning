import { z } from 'zod';
import { instant, revision, userSchema, uuid } from '@/shared/api/primitives';

export const preparationTaskSchema = z.object({
  id: uuid,
  meeting_id: uuid,
  title: z.string(),
  author: userSchema,
  recipient: userSchema.nullable(),
  assignee: userSchema.nullable(),
  updated_by: userSchema,
  state: z.enum(['offered', 'accepted', 'completed', 'declined', 'cancelled']),
  revision,
  created_at: instant,
  updated_at: instant,
  can_accept: z.boolean(),
  can_decline: z.boolean(),
  can_cancel: z.boolean(),
  can_complete: z.boolean(),
});

export type WirePreparationTask = z.infer<typeof preparationTaskSchema>;
