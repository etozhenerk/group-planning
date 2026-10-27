import type { FeedEntry, FeedPage } from '@/entities/meeting/model/types';

export const entry = (sequence: string): FeedEntry => ({
  id: `entry-${sequence}`,
  meetingId: 'meeting',
  sequence,
  kind: 'message',
  actor: { id: 'author', displayName: 'Author' },
  occurredAt: '2026-10-27T18:00:00Z',
  clientRequestId: null,
  text: `message-${sequence}`,
  event: '',
  supported: true,
});

export const page = (
  sequences: string[],
  hasMore = false,
  latestSequence = '999',
): FeedPage => ({
  entries: sequences.map(entry),
  hasMore,
  latestSequence,
  meetingRevision: '1',
  participantCount: 2,
  myRsvp: 'going',
  myRsvpRevision: '1',
});

export const deferredPage = () => {
  const release: { resolve?: (value: FeedPage) => void } = {};
  const promise = new Promise<FeedPage>((resolve) => {
    release.resolve = resolve;
  });

  return { promise, resolve: (value: FeedPage) => release.resolve?.(value) };
};
