import type { z } from 'zod';
import type { preparedCoverSchema } from '@/shared/api';

export { preparedCoverSchema } from '@/shared/api';

export type PreparedCover = z.infer<typeof preparedCoverSchema>;

export const coverDataURL = (cover: PreparedCover) =>
  `data:${cover.media_type};base64,${cover.data}`;
