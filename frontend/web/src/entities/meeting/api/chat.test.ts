import { afterEach, expect, it, vi } from 'vitest';
import { getChatCapabilities } from '@/entities/meeting/api/chat';
import { ApiError } from '@/shared/api';

afterEach(() => vi.unstubAllGlobals());
it('falls back on an old server 404 even when the router returns plain text', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('Not found', { status: 404 }))),
  );
  expect(await getChatCapabilities()).toEqual({
    protocol_version: 1,
    sync: false,
    realtime: false,
    read_state: false,
  });
});
it('does not turn authorization failures or invalid protocol into legacy availability', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response('Unauthorized', { status: 401 }))),
  );
  await expect(getChatCapabilities()).rejects.toMatchObject({ status: 401 });
  vi.stubGlobal(
    'fetch',
    vi.fn(() =>
      Promise.resolve(
        Response.json({
          protocol_version: 8,
          sync: true,
          realtime: true,
          read_state: false,
        }),
      ),
    ),
  );
  await expect(getChatCapabilities()).rejects.toBeInstanceOf(ApiError);
});
