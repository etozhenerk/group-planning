import { expect, it } from 'vitest';
import { boundConversation, feedWindow } from '@/entities/meeting/model/feedWindow';
import type { Conversation, FeedEntry } from '@/entities/meeting/model/types';

const entry = (sequence: number): FeedEntry => ({
  id: String(sequence),
  sequence: String(BigInt(sequence) + 9007199254740993n),
  kind: 'message',
  actor: { id: 'alice', displayName: 'Алиса' },
  meetingId: 'meeting',
  occurredAt: '2026-10-27T00:00:00Z',
  clientRequestId: null,
  text: String(sequence),
  event: '',
  supported: true,
});

const conversation = (start: number, count: number, hasNewer = false): Conversation => {
  const entries = Array.from({ length: count }, (_, index) => entry(start + index));

  return {
    entries,
    hasMore: false,
    hasOlder: start > 0,
    latestSequence: entries.at(-1)?.sequence ?? '0',
    receiveCursor: 'separate',
    meetingRevision: '1',
    participantCount: 2,
    myRsvp: 'going',
    myRsvpRevision: '1',
    window: feedWindow(entries, hasNewer, 'window'),
  };
};

it('keeps at most 500 rows around the visible anchor using decimal positions', () => {
  const result = boundConversation(undefined, conversation(0, 1000), {
    entryId: '300',
    offset: -27,
    following: false,
    focusedId: null,
  });

  expect(result.entries).toHaveLength(500);
  expect(result.entries[0]?.id).toBe('50');
  expect(result.entries.at(-1)?.id).toBe('549');
  expect(result.window?.hasNewer).toBe(true);
  expect(result.hasOlder).toBe(true);
  expect(result.receiveCursor).toBe('separate');
});

it('protects one focused row separately without extending the normal range', () => {
  const before = conversation(0, 500);
  const next = conversation(2000, 50);
  next.window!.id = 'jump';
  const result = boundConversation(before, next, {
    entryId: '2020',
    offset: 0,
    following: false,
    focusedId: '0',
  });

  expect(result.entries).toHaveLength(50);
  expect(result.protectedEntries?.map((row) => row.id)).toEqual(['0']);
  expect(
    boundConversation(result, result, {
      entryId: '2020',
      offset: 0,
      following: false,
      focusedId: null,
    }).protectedEntries,
  ).toEqual([]);
});

it('does not resurrect evicted rows or append a disconnected tail while reading history', () => {
  const before = conversation(0, 500);
  const next = conversation(250, 500, true);
  const result = boundConversation(before, {
    ...next,
    entries: [...next.entries, entry(10000)],
  });

  expect(result.entries).toHaveLength(500);
  expect(result.entries[0]?.id).toBe('250');
  expect(result.entries.at(-1)?.id).toBe('749');
});

it('keeps a tail ACK concurrent with a stale request and trims the far boundary', () => {
  const before = conversation(0, 501);
  const incoming = conversation(0, 500);
  const result = boundConversation(before, incoming);
  expect(result.entries).toHaveLength(500);
  expect(result.entries.at(-1)?.id).toBe('500');
});

it('does not resurrect trimmed rows when a stale receive result commits after history changed', () => {
  const old = boundConversation(undefined, conversation(0, 500));
  const next = conversation(250, 500, true);
  next.window!.revision = old.window!.revision;
  const current = boundConversation(old, next);
  const stale = boundConversation(current, old);
  expect(stale.entries[0]?.id).toBe('250');
  expect(stale.entries.at(-1)?.id).toBe('749');
  expect(stale.entries).toHaveLength(500);
});

it('bounds projection metadata with the live window and removes deleted protected content', () => {
  const next = conversation(0, 1000);
  next.sync = {
    cursor: 'opaque-confirmed',
    streamEpoch: 'epoch',
    window: 'sync',
    hasNewer: false,
    projections: [],
    removed: Array.from({ length: 1000 }, (_, index) => `deleted-${index}`),
    versions: Object.fromEntries(
      next.entries.map((entry) => [`entry:${entry.id}`, '12']),
    ),
  };
  const result = boundConversation(undefined, next);
  expect(Object.keys(result.sync!.versions)).toHaveLength(500);
  expect(result.sync!.removed).toHaveLength(500);
  expect(result.sync!.cursor).toBe('opaque-confirmed');
  result.sync!.removed.push('0');
  const removed = boundConversation(next, result, {
    entryId: '600',
    offset: 0,
    following: false,
    focusedId: '0',
  });

  expect(removed.protectedEntries).toEqual([]);
});
