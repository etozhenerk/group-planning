import type { ChatChanges, ChatSnapshot } from '@/entities/meeting/model/chatSchema';
import type { ChatReadMarker } from '@/entities/meeting/model/chatReadSchema';

export const readStateFromSync = (
  page: ChatSnapshot | ChatChanges,
): ChatReadMarker | null => {
  if (page.unread_baseline_sequence === undefined || page.unread_count === undefined) {
    return null;
  }

  return {
    read_through_sequence: page.my_read_state ?? '0',
    unread_baseline_sequence: page.unread_baseline_sequence,
    unread_count: page.unread_count,
    first_unread: page.first_unread ?? null,
    projection_version: page.projection_version,
  };
};

// The caller resets this state when the meeting, account or stream epoch changes.
export const mergeChatReadState = (
  current: ChatReadMarker | null,
  next: ChatReadMarker,
): ChatReadMarker => {
  if (
    current &&
    (BigInt(next.projection_version) < BigInt(current.projection_version) ||
      BigInt(next.read_through_sequence) < BigInt(current.read_through_sequence))
  ) {
    return current;
  }

  return next;
};
