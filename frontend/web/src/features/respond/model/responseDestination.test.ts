import { expect, it } from 'vitest';
import { responseDestination } from '@/features/respond/model/responseDestination';

it.each([
  ['going', '/meetings/meeting'],
  ['maybe', '/invitations'],
  ['not_going', '/meetings/meeting/declined'],
] as const)('routes confirmed %s to its destination', (answer, expected) => {
  expect(responseDestination('meeting', answer)).toBe(expected);
});
