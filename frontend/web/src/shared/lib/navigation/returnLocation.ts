import { z } from 'zod';

const route = z.union([
  z.enum(['/profile', '/help', '/about', '/privacy', '/cookies', '/meetings']),
  z.string().regex(/^\/meetings\?[^#]*$/),
]);

const state = z.object({
  returnTo: route,
  returnState: z.object({ returnTo: route }).optional(),
});

export const readReturnLocation = (value: unknown, fallback = '/meetings') => {
  const parsed = state.safeParse(value);

  return parsed.success
    ? { path: parsed.data.returnTo, state: parsed.data.returnState }
    : { path: fallback, state: undefined };
};

export const returnLocationLabel = (path: string) => {
  if (path === '/profile') {
    return 'Вернуться в профиль';
  }

  if (path === '/help') {
    return 'Вернуться к помощи';
  }

  if (path === '/about') {
    return 'Вернуться к информации о приложении';
  }

  return 'Вернуться к встречам';
};
