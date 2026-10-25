import { z } from 'zod';

export const preparedCoverSchema = z.object({
  media_type: z.literal('image/jpeg'),
  data: z
    .string()
    .min(4)
    .max(2_796_204)
    .regex(/^[A-Za-z0-9+/]+={0,2}$/),
});
