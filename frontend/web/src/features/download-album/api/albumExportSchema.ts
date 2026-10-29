import { z } from 'zod';
import { instant } from '@/shared/api';

export const albumExportIdSchema = z.string().min(1).max(128);

export const albumExportSchema = z.strictObject({
  id: albumExportIdSchema,
  state: z.enum(['preparing', 'ready', 'failed']),
  count: z.number().int().min(1),
  expires_at: instant,
});

export type AlbumExport = z.infer<typeof albumExportSchema>;
