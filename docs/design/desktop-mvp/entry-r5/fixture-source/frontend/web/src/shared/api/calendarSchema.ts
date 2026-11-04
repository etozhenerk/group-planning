import { z } from 'zod';
import { summarySchema } from '@/shared/api/meetingSchema';
import { instant } from '@/shared/api/primitives';

export const calendarSchema = z.object({
  meetings: z.array(
    summarySchema.extend({
      local_date: z.iso.date().nullable(),
      period: z.enum(['upcoming', 'past', 'undated']),
    }),
  ),
  next_cursor: z.string().nullable(),
  as_of: instant,
  counts: z.object({
    upcoming: z.number().int().nonnegative(),
    past: z.number().int().nonnegative(),
    undated: z.number().int().nonnegative(),
  }),
  days: z.array(z.object({ date: z.iso.date(), count: z.number().int().positive() })),
  next_transition_at: instant.nullable(),
  refresh_after_seconds: z.number().positive(),
});
