import {
  feedSchema,
  invitationLinkSchema,
  meetingSchema,
  meetingsSchema,
  participantsSchema,
  previewSchema,
  request,
} from '@/shared/api';
import { mapInvitation, mapMeeting, mapSummary } from '@/entities/meeting/lib/mapMeeting';
import { mapFeed } from '@/entities/meeting/lib/mapFeed';
import type { Participant } from '@/entities/meeting/model/types';

export const listMeetings = async (cursor: string | null, signal?: AbortSignal) => {
  const wire = await request(
    meetingsSchema,
    `/meetings?limit=50${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`,
    { ...(signal ? { signal } : {}) },
  );

  return { meetings: wire.meetings.map(mapSummary), nextCursor: wire.next_cursor };
};

export const getMeeting = async (id: string, signal?: AbortSignal) => {
  return mapMeeting(
    await request(meetingSchema, `/meetings/${id}`, { ...(signal ? { signal } : {}) }),
  );
};

export const getInvitation = async (token: string, signal?: AbortSignal) => {
  return mapInvitation(
    await request(
      previewSchema,
      `/invitations/${encodeURIComponent(token)}`,
      { ...(signal ? { signal } : {}) },
      true,
    ),
  );
};

export const getInvitationLink = async (id: string, signal?: AbortSignal) => {
  return (
    await request(invitationLinkSchema, `/meetings/${id}/invitation`, {
      ...(signal ? { signal } : {}),
    })
  ).invitation_url;
};

export const getParticipants = async (
  id: string,
  signal?: AbortSignal,
): Promise<Participant[]> => {
  const wire = await request(participantsSchema, `/meetings/${id}/participants`, {
    ...(signal ? { signal } : {}),
  });

  return wire.participants.map((value) => ({
    user: { id: value.user.id, displayName: value.user.display_name },
    role: value.role,
    answer: value.rsvp,
    revision: value.rsvp_revision,
  }));
};

export const getFeed = async (
  id: string,
  cursor: { after?: string; before?: string } = {},
  signal?: AbortSignal,
) => {
  const query = new URLSearchParams({ limit: '50' });

  if (cursor.after) {
    query.set('after_sequence', cursor.after);
  }

  if (cursor.before) {
    query.set('before_sequence', cursor.before);
  }

  return mapFeed(
    await request(feedSchema, `/meetings/${id}/feed?${query}`, {
      ...(signal ? { signal } : {}),
    }),
  );
};
