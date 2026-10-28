import { z } from 'zod';

const route = z.enum([
  '/profile',
  '/help',
  '/about',
  '/privacy',
  '/cookies',
  '/meetings',
]);

const state = z.object({
  returnTo: route,
  returnState: z.object({ returnTo: route }).optional(),
});

export const readReturnLocation = (value: unknown) => {
  const parsed = state.safeParse(value);

  return parsed.success
    ? { path: parsed.data.returnTo, state: parsed.data.returnState }
    : { path: '/meetings', state: undefined };
};
