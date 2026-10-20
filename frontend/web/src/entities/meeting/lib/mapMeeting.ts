import type { WireMeeting, WirePreview, WireResponse, WireSummary } from '@/shared/api';
import type {
  Invitation,
  Meeting,
  MeetingSummary,
  ResponseState,
} from '@/entities/meeting/model/types';

export const mapSummary = (wire: WireSummary): MeetingSummary => {
  return {
    id: wire.id,
    title: wire.title,
    startsAt: wire.starts_at,
    timezone: wire.timezone,
    place: wire.place,
    coverUrl: wire.cover_url,
    participantCount: wire.participant_count,
    revision: wire.revision,
    myRsvp: wire.my_rsvp,
    myRsvpRevision: wire.my_rsvp_revision,
  };
};

export const mapMeeting = (wire: WireMeeting): Meeting => {
  return {
    ...mapSummary(wire),
    organizerId: wire.organizer_id,
    description: wire.description,
    createdAt: wire.created_at,
  };
};

export const mapInvitation = (wire: WirePreview): Invitation => {
  return {
    meetingId: wire.meeting_id,
    title: wire.title,
    startsAt: wire.starts_at,
    timezone: wire.timezone,
    place: wire.place,
    coverUrl: wire.cover_url,
    myRsvp: wire.my_rsvp,
    myRsvpRevision: wire.my_rsvp_revision,
  };
};

export const mapResponse = (wire: WireResponse): ResponseState => {
  return {
    meetingId: wire.meeting_id,
    answer: wire.rsvp,
    revision: wire.rsvp_revision,
    canAccess: wire.can_access_feed,
    meetingRevision: wire.meeting_revision,
  };
};
