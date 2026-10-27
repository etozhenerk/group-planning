import { QueryClient } from '@tanstack/react-query';
import { expect, it, vi } from 'vitest';
import { getFeed } from '@/entities/meeting/api/read';
import { loadWindowPage } from '@/entities/meeting/model/loadWindowPage';
import { accessEpoch, privateKey } from '@/entities/meeting/model/access';
import { feedWindow } from '@/entities/meeting/model/feedWindow';
import { page, deferredPage } from '@/entities/meeting/model/tests/conversationFixture';
import type { Conversation } from '@/entities/meeting/model/types';

vi.mock('@/entities/meeting/api/read', () => ({ getFeed: vi.fn() }));

it('rejects an older page after its boundary was evicted within the same window', async () => {
  const client = new QueryClient();
  const epoch = accessEpoch('user', 'meeting');
  const key = privateKey('user', 'meeting', epoch, 'feed');
  const before = page(['100', '101']);
  client.setQueryData<Conversation>(key, {
    ...before,
    hasOlder: true,
    receiveCursor: '999',
    window: feedWindow(before.entries, true, 'same-window'),
  });
  const gate = deferredPage();
  vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
  const loading = loadWindowPage(client, 'user', 'meeting', epoch, 'older');
  const rejected = expect(loading).rejects.toMatchObject({ name: 'AbortError' });
  const after = page(['200', '201']);
  client.setQueryData<Conversation>(key, {
    ...after,
    hasOlder: true,
    receiveCursor: '999',
    window: feedWindow(after.entries, true, 'same-window', 1),
  });
  gate.resolve(page(['90', '99']));
  await rejected;
  expect(
    client.getQueryData<Conversation>(key)?.entries.map((entry) => entry.sequence),
  ).toEqual(['200', '201']);
  expect(client.getQueryData<Conversation>(key)?.receiveCursor).toBe('999');
  client.clear();
});

it('does not commit an aborted history response and preserves the current content on network failure', async () => {
  const client = new QueryClient();
  const epoch = accessEpoch('user', 'meeting');
  const key = privateKey('user', 'meeting', epoch, 'feed');
  const before = page(['100', '101']);
  client.setQueryData<Conversation>(key, {
    ...before,
    hasOlder: true,
    receiveCursor: '999',
    window: feedWindow(before.entries),
  });
  vi.mocked(getFeed).mockRejectedValueOnce(new TypeError('offline'));
  await expect(loadWindowPage(client, 'user', 'meeting', epoch, 'older')).rejects.toThrow(
    'offline',
  );
  const gate = deferredPage();
  const controller = new AbortController();
  vi.mocked(getFeed).mockReturnValueOnce(gate.promise);
  const loading = loadWindowPage(
    client,
    'user',
    'meeting',
    epoch,
    'older',
    controller.signal,
  );

  const rejected = expect(loading).rejects.toMatchObject({ name: 'AbortError' });
  controller.abort();
  gate.resolve(page(['90', '99']));
  await rejected;
  expect(
    client.getQueryData<Conversation>(key)?.entries.map((entry) => entry.sequence),
  ).toEqual(['100', '101']);
  client.clear();
});
