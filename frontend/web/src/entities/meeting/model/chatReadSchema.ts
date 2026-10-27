import { z } from 'zod';
import { revision, userSchema, uuid } from '@/shared/api';

export const chatReadFields = {
  my_read_state: revision.nullish(),
  unread_baseline_sequence: revision.optional(),
  unread_count: revision.optional(),
  first_unread: uuid.nullish(),
};

export const chatReadMarkerSchema = z.object({
  read_through_sequence: revision,
  unread_baseline_sequence: revision,
  unread_count: revision,
  first_unread: uuid.nullable(),
  projection_version: revision,
});

export const chatReceiptsSchema = z.object({
  receipts: z.array(z.object({ entry_id: uuid, reader_count: revision })).max(100),
  projection_version: revision,
});

export const chatReadersSchema = z.object({
  readers: z.array(userSchema).max(100),
  reader_count: revision,
  next_cursor: z.string().min(1).nullable(),
  projection_version: revision,
});

export type ChatReadMarker = z.infer<typeof chatReadMarkerSchema>;

export type ChatReceipts = z.infer<typeof chatReceiptsSchema>;

export type ChatReaders = z.infer<typeof chatReadersSchema>;
