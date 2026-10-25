import { z } from 'zod';
import { instant, userSchema, uuid } from '@/shared/api/primitives';

export const mediaSchema = z.object({
  id: uuid,
  meeting_id: uuid,
  file_name: z.string(),
  content_type: z.string(),
  size_bytes: z.number(),
  kind: z.enum(['photo', 'file']),
  purpose: z.enum(['message', 'memory']),
  status: z.enum(['pending', 'uploaded', 'published']),
  download_url: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  created_at: instant,
  uploaded_by: userSchema,
});

export const mediaResultSchema = z.object({ media: mediaSchema });

export const memoriesSchema = z.object({
  photos: z.array(mediaSchema),
  next_cursor: z.string().nullable(),
});

export const mediaLimitsSchema = z.object({
  max_photo_bytes: z.number(),
  max_file_bytes: z.number(),
  max_files: z.number(),
  photo_types: z.array(z.string()),
  file_types: z.array(z.string()),
});

export type Media = z.infer<typeof mediaSchema>;

export type MediaLimits = z.infer<typeof mediaLimitsSchema>;
