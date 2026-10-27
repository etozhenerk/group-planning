import { ApiError, request, revision, uuid, writeOptions } from '@/shared/api';
import {
  chatReadMarkerSchema,
  chatReadersSchema,
  chatReceiptsSchema,
} from '@/entities/meeting/model/chatReadSchema';

export const putChatReadMarker = async (
  meetingId: string,
  sequence: string,
  csrf: string | null,
  signal?: AbortSignal,
  keepalive = false,
) => {
  const result = await request(
    chatReadMarkerSchema,
    `/meetings/${uuid.parse(meetingId)}/read-marker`,
    {
      ...writeOptions('PUT', csrf, { read_through_sequence: revision.parse(sequence) }),
      ...(signal ? { signal } : {}),
      keepalive,
    },
  );

  if (BigInt(result.read_through_sequence) < BigInt(sequence)) {
    throw new ApiError(502, 'invalid_response');
  }

  return result;
};

export const queryChatReceipts = async (
  meetingId: string,
  entryIds: readonly string[],
  csrf: string | null,
  signal?: AbortSignal,
) => {
  const ids = entryIds.map((id) => uuid.parse(id).toLowerCase());

  if (ids.length < 1 || ids.length > 100 || new Set(ids).size !== ids.length) {
    throw new Error('Receipt query requires 1–100 distinct entry IDs');
  }

  const result = await request(
    chatReceiptsSchema,
    `/meetings/${uuid.parse(meetingId)}/read-receipts/query`,
    {
      ...writeOptions('POST', csrf, { entry_ids: ids }),
      ...(signal ? { signal } : {}),
    },
  );

  const received = result.receipts.map((receipt) => receipt.entry_id.toLowerCase());

  if (
    received.length !== ids.length ||
    new Set(received).size !== ids.length ||
    received.some((id) => !ids.includes(id))
  ) {
    throw new ApiError(502, 'invalid_response');
  }

  return result;
};

export const getChatReaders = (
  meetingId: string,
  entryId: string,
  cursor?: string,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({ limit: '50' });

  if (cursor) {
    params.set('cursor', cursor);
  }

  return request(
    chatReadersSchema,
    `/meetings/${uuid.parse(meetingId)}/messages/${uuid.parse(entryId)}/readers?${params}`,
    { ...(signal ? { signal } : {}) },
  );
};
