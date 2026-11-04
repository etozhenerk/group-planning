import { describe, expect, it } from 'vitest';
import { unreadLabel, unreadNotice } from '@/entities/meeting/lib/unreadLabel';

describe('unread counts retain exact accessible quantities', () => {
  it.each([
    ['1', '1 непрочитанное', '1 непрочитанное сообщение'],
    ['2', '2 непрочитанных', '2 непрочитанных сообщения'],
    ['11', '11 непрочитанных', '11 непрочитанных сообщений'],
    ['21', '21 непрочитанное', '21 непрочитанное сообщение'],
    ['99', '99 непрочитанных', '99 непрочитанных сообщений'],
    ['100', '99+ непрочитанных', '100 непрочитанных сообщений'],
    ['9007199254741021', '99+ непрочитанных', '9007199254741021 непрочитанное сообщение'],
  ])(
    '%s uses a compact caption without losing the exact count',
    (count, notice, name) => {
      expect(unreadNotice(count)).toBe(notice);
      expect(unreadLabel(count)).toBe(name);
    },
  );
});
