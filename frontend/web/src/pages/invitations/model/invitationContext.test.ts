import { describe, expect, it } from 'vitest';
import {
  invitationContext,
  invitationOrganizer,
} from '@/pages/invitations/model/invitationContext';

const id = '11111111-1111-4111-8111-111111111111';

describe('saved invitation history context', () => {
  it('keeps only the public organizer fields across a reload', () => {
    const source = {
      id,
      displayName: 'Александра Константинопольская',
      avatarUrl: null,
      email: 'private@example.test',
      phone: '+79990000000',
    };

    const state = JSON.parse(JSON.stringify(invitationContext(source))) as unknown;
    expect(invitationOrganizer(state)).toEqual({
      id,
      displayName: source.displayName,
      avatarUrl: null,
    });
    expect(JSON.stringify(state)).not.toContain('private');
    expect(JSON.stringify(state)).not.toContain('phone');
  });

  it('rejects malformed or unrelated navigation state', () => {
    for (const state of [
      null,
      {},
      { source: 'other' },
      { source: 'invitations', organizer: { id: 'bad' } },
    ]) {
      expect(invitationOrganizer(state)).toBeUndefined();
    }
  });

  it('preserves an explicit neutral public identity', () => {
    expect(
      invitationOrganizer(
        invitationContext({ id, displayName: 'Удалённый аккаунт', avatarUrl: null }),
      ),
    ).toEqual({ id, displayName: 'Удалённый аккаунт', avatarUrl: null });
  });
});
