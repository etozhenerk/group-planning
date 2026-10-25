import { describe, expect, it } from 'vitest';
import { projectReaction } from '@/features/message-reactions/lib/projectReaction';

const session = { user: { id: 'me', displayName: 'Саша' }, csrf: null, expiresAt: '' };
describe('optimistic reaction state', () => {
  it('sets the desired state without double-counting repeated actions', () => {
    const active = projectReaction([], { emoji: '❤️', active: true }, session);
    expect(active[0]?.count).toBe(1);
    expect(projectReaction(active, { emoji: '❤️', active: true }, session)).toEqual(
      active,
    );
    expect(projectReaction(active, { emoji: '❤️', active: false }, session)).toEqual([]);
  });
  it('removes only the current author and keeps other confirmed reactions intact', () => {
    const original = [
      {
        emoji: '👍',
        count: 2,
        mine: true,
        users: [
          { id: 'me', display_name: 'Саша' },
          { id: 'other', display_name: 'Лена' },
        ],
      },
    ];

    const result = projectReaction(original, { emoji: '👍', active: false }, session);
    expect(result[0]).toMatchObject({
      count: 1,
      mine: false,
      users: [{ id: 'other', display_name: 'Лена' }],
    });
    expect(original[0]?.count).toBe(2);
  });
});
