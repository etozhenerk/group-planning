import { z } from 'zod';
import {
  answerSchema,
  datePollSchema,
  entrySchema,
  instant,
  placePollSchema,
  preparationTaskSchema,
  revision,
  uuid,
} from '@/shared/api';
import { entryReactionsSchema } from '@/entities/meeting/model/reactions';
import { chatReadFields } from '@/entities/meeting/model/chatReadSchema';

export const chatCapabilitiesSchema = z.object({
  protocol_version: z.literal(1),
  sync: z.boolean(),
  read_state: z.boolean(),
  realtime: z.boolean(),
});

export const chatMeetingSchema = z.object({
  id: uuid,
  organizer_id: uuid,
  title: z.string(),
  description: z.string().nullable(),
  starts_on: z.string().nullable(),
  starts_at: instant.nullable(),
  timezone: z.string(),
  place: z.string().nullable(),
  cover_url: z.string().nullable(),
  period: z.enum(['upcoming', 'past', 'undated']),
  revision,
  participant_count: z.number().int().min(1),
  my_rsvp: answerSchema.nullable(),
  my_rsvp_revision: revision,
});

export const chatProjectionSchema = z.object({
  resource_kind: z.enum([
    'entry',
    'date_poll',
    'place_poll',
    'preparation_task',
    'reactions',
  ]),
  resource_id: uuid,
  projection_version: revision,
  entry: entrySchema.optional(),
  date_poll: datePollSchema.optional(),
  place_poll: placePollSchema.optional(),
  preparation_task: preparationTaskSchema.optional(),
  reactions: z.array(entryReactionsSchema).optional(),
});

export const chatSnapshotSchema = z.object({
  mode: z.literal('snapshot'),
  stream_epoch: z.string().min(1),
  change_cursor: z.string().min(1),
  entries: z.array(entrySchema),
  projections: z.array(chatProjectionSchema),
  meeting: chatMeetingSchema,
  projection_version: revision,
  latest_sequence: revision,
  range: z.object({
    first_sequence: revision.nullable(),
    last_sequence: revision.nullable(),
  }),
  has_older: z.boolean(),
  has_newer: z.boolean(),
  ...chatReadFields,
});

export const chatChangesSchema = z.object({
  mode: z.literal('changes'),
  stream_epoch: z.string().min(1),
  next_cursor: z.string().min(1),
  through_cursor: z.string().min(1),
  has_more: z.boolean(),
  meeting: chatMeetingSchema,
  projection_version: revision,
  ...chatReadFields,
  changes: z.array(
    z.object({
      kind: z.enum([
        'entry_upsert',
        'entry_removed',
        'meeting_changed',
        'receipts_changed',
        'history_invalidated',
      ]),
      entry_id: uuid.nullish(),
      resource_kind: z.string().nullish(),
      resource_id: uuid.nullish(),
      projection_version: revision,
      projection: chatProjectionSchema.nullish(),
    }),
  ),
});

export type ChatCapabilities = z.infer<typeof chatCapabilitiesSchema>;

export type ChatSnapshot = z.infer<typeof chatSnapshotSchema>;

export type ChatChanges = z.infer<typeof chatChangesSchema>;

export type ChatProjection = z.infer<typeof chatProjectionSchema>;
