import type { PublicUser } from '@/shared/api';
import type { Invitation, Meeting } from '@/entities/meeting/model/types';

export const publicInvitation = (
  meeting: Meeting,
  organizer?: PublicUser,
): Invitation => ({
  meetingId: meeting.id,
  title: meeting.title,
  description: meeting.description,
  startsAt: meeting.startsAt,
  startsOn: meeting.startsOn ?? null,
  timezone: meeting.timezone,
  place: meeting.place,
  coverUrl: null,
  myRsvp: meeting.myRsvp,
  myRsvpRevision: meeting.myRsvpRevision,
  ...(organizer ? { organizer } : {}),
});
