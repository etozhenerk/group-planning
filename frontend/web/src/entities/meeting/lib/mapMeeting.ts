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
    ...(wire.period ? { period: wire.period } : {}),
    ...(wire.organizer_id ? { organizerId: wire.organizer_id } : {}),
    ...(wire.unread_count === undefined ? {} : { unreadCount: wire.unread_count }),
    ...(wire.first_unread === undefined ? {} : { firstUnread: wire.first_unread }),
    participantPreview: wire.participant_preview ?? [],
    memoryPhotoCount: wire.memory_photo_count ?? 0,
    memoryPreview: wire.memory_preview ?? [],
    title: wire.title,
    startsAt: wire.starts_at,
    startsOn: wire.starts_on ?? null,
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
    ...(wire.organizer
      ? { organizer: { id: wire.organizer.id, displayName: wire.organizer.display_name } }
      : {}),
    ...(wire.can_join === undefined ? {} : { canJoin: wire.can_join }),
    joinClosesAt: wire.join_closes_at ?? null,
    joinDisabledReason: wire.join_disabled_reason ?? null,
    title: wire.title,
    description: wire.description ?? null,
    startsAt: wire.starts_at,
    startsOn: wire.starts_on ?? null,
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
