import { expect, test } from 'vitest';
import { birthdayLabel, sexLabel } from '@/pages/profile/lib/personalLabels';

test.each([
  ['1990-12-23', '23 декабря 1990'],
  ['0000-12-23', '23 декабря'],
  ['1990-00-00', '1990'],
  ['1990-12-00', 'декабрь 1990'],
  ['1990-00-23', '23 число, 1990'],
  ['0000-00-23', '23 число'],
  ['0000-12-00', 'декабрь'],
  ['0000-00-00', 'Не указано'],
  [null, 'Не указано'],
  ['bad', 'Не указано'],
  ['1990-02-30', 'Не указано'],
  ['0000-02-29', '29 февраля'],
])('birthday %s never invents missing parts', (value, expected) =>
  expect(birthdayLabel(value)).toBe(expected),
);

test('sex labels preserve missing or unknown values', () => {
  expect(sexLabel('male')).toBe('Мужской');
  expect(sexLabel('female')).toBe('Женский');
  expect(sexLabel(null)).toBe('Не указано');
  expect(sexLabel('unknown')).toBe('Не указано');
});
