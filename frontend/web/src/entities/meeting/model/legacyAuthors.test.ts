import { afterEach, expect, it, vi } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { getFeed } from '@/entities/meeting/api/read';
import { accessEpoch, privateKey, resetAccess } from '@/entities/meeting/model/access';
import { loadConversation } from '@/entities/meeting/model/loadConversation';
import { shareConversation } from '@/entities/meeting/model/shareConversation';
import { feedWindow } from '@/entities/meeting/model/feedWindow';
import { entry, page } from '@/entities/meeting/model/tests/conversationFixture';
import type { Conversation } from '@/entities/meeting/model/types';
import type { FeedPosition } from '@/entities/meeting/model/feedWindow';

vi.mock('@/entities/meeting/api/read', () => ({ getFeed: vi.fn() }));
const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
afterEach(() => {
  client.clear();
  vi.mocked(getFeed).mockReset();
  resetAccess();
});

it('refreshes legacy authors in cached and protected rows without advancing receive or viewport', async () => {
  const epoch = accessEpoch('user', 'meeting');
  const key = privateKey('user', 'meeting', epoch, 'feed');
  const cached = (sequence: string) => ({
    ...entry(sequence),
    actor: {
      id: 'deleted',
      displayName: 'Лена',
      avatarUrl: 'https://images.example.test/lena.jpg',
    },
  });

  const entries = ['31', '32'].map(cached);
  const window = feedWindow(entries);
  const position: FeedPosition = {
    entryId: 'entry-31',
    offset: 2,
    following: false,
    focusedId: 'entry-2',
  };

  client.setQueryData<Conversation>(key, {
    ...page(['31', '32']),
    entries,
    window,
    protectedEntries: [cached('2')],
    hasOlder: true,
    receiveCursor: '32',
    newMessages: 0,
  });
  const renamed = (sequence: string) => ({
    ...entry(sequence),
    actor: { id: 'deleted', displayName: 'Удалённый аккаунт', avatarUrl: null },
  });

  vi.mocked(getFeed)
    .mockResolvedValueOnce({ ...page([], false, '32'), meetingRevision: '2' })
    .mockResolvedValueOnce({ ...page(['2']), entries: [renamed('2')] })
    .mockResolvedValueOnce({ ...page(['31'], true), entries: [renamed('31')] })
    .mockResolvedValueOnce({ ...page(['32']), entries: [renamed('32')] });
  const result = await client.fetchQuery({
    queryKey: key,
    structuralSharing: (previous, incoming) =>
      shareConversation(previous, incoming, position),
    queryFn: ({ signal }) => loadConversation(client, 'user', 'meeting', epoch, signal),
  });

  expect(result.entries.map((value) => value.actor.displayName)).toEqual([
    'Удалённый аккаунт',
    'Удалённый аккаунт',
  ]);
  expect(result.protectedEntries?.[0]?.actor.displayName).toBe('Удалённый аккаунт');
  expect(result.entries.map((value) => value.actor.avatarUrl)).toEqual([null, null]);
  expect(result.protectedEntries?.[0]?.actor.avatarUrl).toBeNull();
  expect(result.receiveCursor).toBe('32');
  expect(result.window?.id).toBe(window.id);
  expect(result.newMessages).toBe(0);
  expect(vi.mocked(getFeed).mock.calls.map((call) => call[1])).toEqual([
    { after: '32' },
    { after: '1' },
    { after: '30' },
    { after: '31' },
  ]);
});
