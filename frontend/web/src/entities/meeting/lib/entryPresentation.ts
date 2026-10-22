import type { FeedEntry } from '@/entities/meeting/model/types';

const pollNotifications = new Set([
  'date_poll_applied',
  'date_poll_no_majority',
  'date_poll_choice_required',
  'date_poll_time_required',
  'date_poll_cancelled',
]);

export const entryPresentation = (
  entry: FeedEntry,
): 'message' | 'poll' | 'notification' | 'system' => {
  if (entry.text !== null) {
    return 'message';
  }

  if (entry.pollId) {
    return 'poll';
  }

  return entry.supported && pollNotifications.has(entry.kind) ? 'notification' : 'system';
};
