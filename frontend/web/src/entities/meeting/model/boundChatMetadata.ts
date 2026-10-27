import type { ChatState } from '@/entities/meeting/model/chatState';
import type { FeedEntry } from '@/entities/meeting/model/types';

export const boundChatMetadata = (state: ChatState, entries: FeedEntry[]): ChatState => {
  const retained = new Set(
    entries.flatMap((entry) =>
      [entry.id, entry.pollId, entry.placePollId, entry.taskId].filter(
        (id): id is string => !!id,
      ),
    ),
  );

  return {
    ...state,
    versions: Object.fromEntries(
      Object.entries(state.versions).filter(([key]) =>
        retained.has(key.slice(key.indexOf(':') + 1)),
      ),
    ),
    removed: state.removed.slice(-500),
    projections: state.projections.filter((projection) =>
      retained.has(projection.resource_id),
    ),
  };
};
