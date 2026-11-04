import { afterEach, expect, it, vi } from 'vitest';
import { getSession } from '@/entities/session/api/session';

afterEach(() => vi.unstubAllGlobals());

it('carries the public photo through session refresh without private profile fields', async () => {
  const user = {
    id: '00000000-0000-4000-8000-000000000003',
    display_name: 'Лена',
    avatar_url: 'https://images.example.test/lena.jpg',
    email: 'private@example.test',
  };

  const fetch = vi
    .fn()
    .mockResolvedValueOnce(
      Response.json({ user, expires_at: '2026-11-04T20:00:00Z', csrf_token: null }),
    )
    .mockResolvedValueOnce(
      Response.json({
        user: { ...user, avatar_url: null },
        expires_at: '2026-11-04T20:00:00Z',
        csrf_token: null,
      }),
    );

  vi.stubGlobal('fetch', fetch);
  expect((await getSession())?.user).toEqual({
    id: user.id,
    displayName: 'Лена',
    avatarUrl: user.avatar_url,
  });
  expect((await getSession())?.user.avatarUrl).toBeNull();
});
