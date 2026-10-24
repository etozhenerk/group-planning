import { placePollSchema, request, writeOptions } from '@/shared/api';
import { mapPlacePoll } from '@/entities/meeting/lib/mapPlacePoll';
import type { PlacePollCreate, PlaceVoteInput } from '@/entities/meeting/model/placePoll';

export const getPlacePoll = async (meeting: string, id: string, signal: AbortSignal) =>
  mapPlacePoll(
    await request(placePollSchema, `/meetings/${meeting}/place-polls/${id}`, { signal }),
  );

export const createPlacePoll = async (
  meeting: string,
  input: PlacePollCreate,
  csrf: string | null,
  key: string,
) =>
  mapPlacePoll(
    await request(
      placePollSchema,
      `/meetings/${meeting}/place-polls`,
      writeOptions('POST', csrf, { place: input.place, closes_at: input.closesAt }, key),
    ),
  );

export const votePlacePoll = async (
  meeting: string,
  id: string,
  input: PlaceVoteInput,
  csrf: string | null,
  key: string,
) =>
  mapPlacePoll(
    await request(
      placePollSchema,
      `/meetings/${meeting}/place-polls/${id}/vote`,
      writeOptions(
        'PUT',
        csrf,
        { answer: input.answer, expected_revision: input.revision },
        key,
      ),
    ),
  );
