import type { Answer } from '@/shared/api';
import {
  createdSchema,
  entrySchema,
  meetingSchema,
  request,
  responseSchema,
  writeOptions,
} from '@/shared/api';
import { mapMeeting, mapResponse } from '@/entities/meeting/lib/mapMeeting';
import { mapEntry } from '@/entities/meeting/lib/mapFeed';
import type { MeetingInput } from '@/entities/meeting/model/types';

export const createMeeting = async (
  input: MeetingInput,
  csrf: string | null,
  key: string,
) => {
  const wire = await request(
    createdSchema,
    '/meetings',
    writeOptions('POST', csrf, input, key),
  );

  return { meeting: mapMeeting(wire.meeting), invitationUrl: wire.invitation_url };
};

export const updateMeeting = async (
  id: string,
  input: Partial<MeetingInput>,
  expected: string,
  csrf: string | null,
  key: string,
) => {
  return mapMeeting(
    await request(
      meetingSchema,
      `/meetings/${id}`,
      writeOptions('PATCH', csrf, { ...input, expected_revision: expected }, key),
    ),
  );
};

export const saveResponse = async (
  target: { token?: string; id?: string },
  answer: Answer,
  expected: string,
  csrf: string | null,
  key: string,
) => {
  const path = target.token
    ? `/invitations/${encodeURIComponent(target.token)}/rsvp`
    : `/meetings/${target.id ?? ''}/rsvp`;

  return mapResponse(
    await request(
      responseSchema,
      path,
      writeOptions('PUT', csrf, { answer, expected_revision: expected }, key),
    ),
  );
};

export const sendMessage = async (
  id: string,
  text: string,
  key: string,
  csrf: string | null,
  signal: AbortSignal,
) => {
  return mapEntry(
    await request(entrySchema, `/meetings/${id}/messages`, {
      ...writeOptions('POST', csrf, { text, client_request_id: key }, key),
      signal,
    }),
  );
};
