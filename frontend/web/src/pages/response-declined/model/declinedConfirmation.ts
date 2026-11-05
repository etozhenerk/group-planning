import { z } from 'zod';

export const declinedConfirmation = z.object({
  declinedMeetingTitle: z.string().min(1),
  declinedUserId: z.string().min(1),
});
