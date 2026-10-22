import { z } from 'zod';
import {
  answerSchema,
  instant,
  revision,
  userSchema,
  uuid,
} from '@/shared/api/primitives';

export const summarySchema = z.object({
  id: uuid,
  title: z.string(),
  starts_at: instant.nullable(),
  starts_on: z.iso.date().nullable().optional(),
  timezone: z.string(),
  place: z.string().nullable(),
  cover_url: z.url().nullable(),
  participant_count: z.number().int().min(1),
  revision,
  my_rsvp: answerSchema.nullable(),
  my_rsvp_revision: revision,
});

export const meetingSchema = summarySchema.extend({
  organizer_id: uuid,
  description: z.string().nullable(),
  created_at: instant,
});

export const createdSchema = z.object({
  meeting: meetingSchema,
  role: z.literal('organizer'),
  invitation_url: z.url(),
});

export const meetingsSchema = z.object({
  meetings: z.array(summarySchema),
  next_cursor: z.string().nullable(),
});

export const previewSchema = z.object({
  meeting_id: uuid,
  title: z.string(),
  description: z.string().nullable().optional(),
  starts_at: instant.nullable(),
  starts_on: z.iso.date().nullable().optional(),
  timezone: z.string(),
  place: z.string().nullable(),
  cover_url: z.url().nullable(),
  my_rsvp: answerSchema.nullable(),
  my_rsvp_revision: revision,
});

export const responseSchema = z.object({
  meeting_id: uuid,
  rsvp: answerSchema,
  rsvp_revision: revision,
  can_access_feed: z.boolean(),
  meeting_revision: revision,
});

export const participantsSchema = z.object({
  participants: z.array(
    z.object({
      user: userSchema,
      role: z.enum(['organizer', 'guest']),
      rsvp: answerSchema.nullable(),
      rsvp_revision: revision,
    }),
  ),
});

export type WireMeeting = z.infer<typeof meetingSchema>;

export type WireSummary = z.infer<typeof summarySchema>;

export type WirePreview = z.infer<typeof previewSchema>;

export type WireResponse = z.infer<typeof responseSchema>;
