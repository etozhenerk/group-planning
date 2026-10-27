import { expect, it } from 'vitest';
import { QueryClient } from '@tanstack/react-query';
import { applyChatProjections } from '@/entities/meeting/model/applyChatProjections';
import { privateKey } from '@/entities/meeting/model/access';
import type { PlacePoll } from '@/entities/meeting/model/placePoll';

it('cancels an older card response and preserves a newer command revision', async () => {
  const client = new QueryClient();
  const key = privateKey('user', 'meeting', 0, 'place-poll:place');
  const projection = {
    resource_kind: 'place_poll' as const,
    resource_id: 'entry',
    projection_version: '20',
    place_poll: {
      id: 'place',
      author: { id: 'user', display_name: 'Автор' },
      created_at: '2026-10-01T00:00:00Z',
      closed_at: null,
      meeting_id: 'meeting',
      place: 'Новое место',
      explanation: '',
      previous_place: null,
      state: 'open' as const,
      revision: '20',
      my_vote_revision: '0',
      my_vote: null,
      votes_for: 0,
      votes_against: 0,
      closes_at: '2026-12-01T00:00:00Z',
      can_vote: true,
    },
  };

  applyChatProjections(client, 'user', 'meeting', 0, [projection]);
  let aborted = false;
  const gate: { resolve?: (value: PlacePoll) => void } = {};
  const pending = client
    .fetchQuery<PlacePoll>({
      queryKey: key,
      queryFn: ({ signal }) =>
        new Promise((resolve) => {
          gate.resolve = resolve;
          signal.addEventListener('abort', () => {
            aborted = true;
          });
        }),
    })
    .catch(() => undefined);

  applyChatProjections(client, 'user', 'meeting', 0, [
    {
      ...projection,
      place_poll: { ...projection.place_poll, revision: '19', place: 'Старое' },
    },
  ]);
  expect(aborted).toBe(true);
  expect(client.getQueryData<PlacePoll>(key)?.place).toBe('Новое место');
  gate.resolve?.({
    ...client.getQueryData<PlacePoll>(key)!,
    revision: '18',
    place: 'Запоздалый HTTP',
  });
  await pending;
  expect(client.getQueryData<PlacePoll>(key)?.revision).toBe('20');
  client.clear();
});

it('applies current reaction projections to active query windows without another HTTP request', () => {
  const client = new QueryClient();
  const key = [...privateKey('user', 'meeting', 0, 'reactions'), 'a,b'];
  client.setQueryData(key, [
    { entry_id: 'a', reactions: [] },
    { entry_id: 'b', reactions: [] },
  ]);
  const reactions = [{ emoji: '👍', count: 1, mine: false, users: [] }];
  applyChatProjections(client, 'user', 'meeting', 0, [
    {
      resource_kind: 'reactions',
      resource_id: 'a',
      projection_version: '99',
      reactions: [{ entry_id: 'a', reactions }],
    },
  ]);
  expect(client.getQueryData(key)).toEqual([
    { entry_id: 'a', reactions },
    { entry_id: 'b', reactions: [] },
  ]);
  client.clear();
});
