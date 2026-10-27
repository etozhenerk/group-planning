import { mergeReadProjection } from '@/entities/meeting/model/readProjection';
import { replaceEqualDeep } from '@tanstack/react-query';
import { boundConversation } from '@/entities/meeting/model/feedWindow';
import type { FeedPosition } from '@/entities/meeting/model/feedWindow';
import type { Conversation } from '@/entities/meeting/model/types';

export const shareConversation = (
  oldData: unknown,
  newData: unknown,
  position?: FeedPosition,
) => {
  // The callback belongs to the typed private query, after API validation.
  const previous = oldData as Conversation | undefined;
  const incoming = newData as Conversation;
  const next = boundConversation(previous, incoming, position);

  if (previous?.sync?.streamEpoch === incoming.sync?.streamEpoch && next.read) {
    next.read = mergeReadProjection(previous?.read, next.read);
  }

  return replaceEqualDeep(oldData, next);
};
