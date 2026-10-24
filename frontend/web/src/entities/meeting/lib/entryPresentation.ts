import type { FeedEntry } from '@/entities/meeting/model/types';

export const entryPresentation = (entry: FeedEntry): 'message' | 'poll' | 'system' => {
  if (entry.text !== null) {
    return 'message';
  }

  if (entry.pollId || entry.placePollId || entry.taskId) {
    return 'poll';
  }

  return 'system';
};
