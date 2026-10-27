import { describe, expect, it } from 'vitest';
import { chatSnapshot, chatChanges } from '@/entities/meeting/model/tests/chatFixture';
import {
  applyChatChanges,
  snapshotConversation,
} from '@/entities/meeting/model/chatState';
import { shareConversation } from '@/entities/meeting/model/shareConversation';

describe('read projections at the query commit boundary', () => {
  it('keeps a newer marker after a delayed snapshot but resets it for a different stream', () => {
    const old = snapshotConversation({
      ...chatSnapshot('200'),
      my_read_state: '150',
      unread_baseline_sequence: '100',
      unread_count: '0',
      first_unread: null,
    });

    const delayed = snapshotConversation({
      ...chatSnapshot('190'),
      my_read_state: '140',
      unread_baseline_sequence: '100',
      unread_count: '3',
      first_unread: 'entry',
    });

    expect(shareConversation(old, delayed).read).toEqual(old.read);
    delayed.sync!.streamEpoch = 'new-stream';
    expect(shareConversation(old, delayed).read).toEqual(delayed.read);
  });
  it('clears explicit first_unread and preserves legacy omitted read fields', () => {
    const old = snapshotConversation({
      ...chatSnapshot('200'),
      my_read_state: '150',
      unread_baseline_sequence: '100',
      unread_count: '3',
      first_unread: 'entry',
    });

    const next = applyChatChanges(old, {
      ...chatChanges('201'),
      my_read_state: '160',
      unread_baseline_sequence: '100',
      unread_count: '0',
      first_unread: null,
    });

    expect(next.read?.firstUnread).toBeNull();
    expect(applyChatChanges(next, chatChanges('202')).read).toEqual(next.read);
  });
});
