import { z } from 'zod';
import { previewSchema } from '@/shared/api/meetingSchema';
import { uuid } from '@/shared/api/primitives';

export const invitationsSchema = z.object({
  invitations: z.array(
    z.object({
      invitation_url: z.url(),
      preview: previewSchema.extend({ my_rsvp: z.literal('maybe') }),
    }),
  ),
  next_cursor: uuid.nullable(),
});
