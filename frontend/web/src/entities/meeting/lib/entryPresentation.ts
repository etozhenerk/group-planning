import type { FeedEntry } from '@/entities/meeting/model/types';

export const entryPresentation = (entry: FeedEntry): 'message' | 'poll' | 'system' => {
  if (entry.text !== null) {
    return 'message';
  }

  if (entry.pollId) {
    return 'poll';
  }

  return 'system';
};
