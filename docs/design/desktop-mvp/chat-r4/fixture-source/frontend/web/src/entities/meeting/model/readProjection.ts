import {
  mergeChatReadState,
  readStateFromSync,
} from '@/entities/meeting/model/chatReadState';
import type { ChatChanges, ChatSnapshot } from '@/entities/meeting/model/chatSchema';
import type { ChatReadMarker } from '@/entities/meeting/model/chatReadSchema';

export type ChatReadState = {
  through: string;
  baseline: string;
  unreadCount: string;
  firstUnread: string | null;
  version: string;
};
const wireState = (value: ChatReadState): ChatReadMarker => ({
  read_through_sequence: value.through,
  unread_baseline_sequence: value.baseline,
  unread_count: value.unreadCount,
  first_unread: value.firstUnread,
  projection_version: value.version,
});

const viewState = (value: ChatReadMarker): ChatReadState => ({
  through: value.read_through_sequence,
  baseline: value.unread_baseline_sequence,
  unreadCount: value.unread_count,
  firstUnread: value.first_unread,
  version: value.projection_version,
});

export const markerReadState = (
  result: ChatReadMarker,
  previous?: ChatReadState,
): ChatReadState =>
  viewState(mergeChatReadState(previous ? wireState(previous) : null, result));

export const pageReadState = (
  page: ChatChanges | ChatSnapshot,
  previous?: ChatReadState,
) => {
  if (page.my_read_state === null) {
    return undefined;
  }

  const incoming = readStateFromSync(page);

  return incoming ? markerReadState(incoming, previous) : previous;
};

export const mergeReadProjection = (
  current: ChatReadState | undefined,
  next: ChatReadState,
): ChatReadState => markerReadState(wireState(next), current);
