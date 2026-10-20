import { z } from 'zod';
import {
  answerSchema,
  instant,
  revision,
  userSchema,
  uuid,
} from '@/shared/api/primitives';

export const entrySchema = z.object({
  id: uuid,
  meeting_id: uuid,
  sequence: revision,
  kind: z.string(),
  payload_version: z.number().int().min(1),
  actor: userSchema,
  occurred_at: instant,
  payload: z.record(z.string(), z.unknown()),
  client_request_id: uuid.nullable(),
});

export const feedSchema = z.object({
  entries: z.array(entrySchema),
  has_more: z.boolean(),
  meeting_revision: revision,
  participant_count: z.number().int().min(1),
  my_rsvp: answerSchema.nullable(),
  my_rsvp_revision: revision,
  latest_sequence: revision,
});

export type WireEntry = z.infer<typeof entrySchema>;

export type WireFeed = z.infer<typeof feedSchema>;
