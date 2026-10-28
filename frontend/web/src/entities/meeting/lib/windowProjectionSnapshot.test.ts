import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import {
  retainWindowProjection,
  selectWindowProjection,
} from '@/entities/meeting/lib/retainWindowProjection';

const scope = ['private', 'user', 'meeting', 1, 'reactions'] as const;
const data = [
  { entry_id: 'a', count: 1 },
  { entry_id: 'b', count: 2 },
];

describe('confirmed projection snapshot across a query error', () => {
  it('keeps only confirmed overlap after QueryObserver discards its placeholder on error and then accepts retry', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const key = [...scope, 'a,b'];
    client.setQueryData(key, data);
    const gate: { fail?: (reason: Error) => void } = {};
    const next = new Promise<typeof data>((_resolve, reject) => {
      gate.fail = reject;
    });

    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn: () => next,
      staleTime: Infinity,
      gcTime: 0,
    });

    const unsubscribe = observer.subscribe(() => {});
    const confirmed = selectWindowProjection(
      scope,
      ['a', 'b'],
      observer.getCurrentResult(),
      undefined,
      false,
    );

    observer.setOptions({
      queryKey: [...scope, 'a,c'],
      queryFn: () => next,
      staleTime: Infinity,
      gcTime: 0,
      placeholderData: (previous, query) =>
        retainWindowProjection(scope, ['a', 'c'], previous, query?.queryKey, false),
    });
    expect(observer.getCurrentResult().isPlaceholderData).toBe(true);
    gate.fail?.(new Error('GET503'));
    await observer.refetch();
    const failed = observer.getCurrentResult();
    expect(failed.isError).toBe(true);
    expect(failed.data).toBeUndefined();
    const retained = selectWindowProjection(
      scope,
      ['a', 'c'],
      failed,
      confirmed.snapshot,
      false,
    );

    expect(retained.data).toEqual([data[0]]);
    expect(failed.isSuccess).toBe(false);
    expect(failed.error?.message).toBe('GET503');
    observer.setOptions({
      queryKey: [...scope, 'a,c'],
      queryFn: () =>
        Promise.resolve([
          { entry_id: 'a', count: 3 },
          { entry_id: 'c', count: 0 },
        ]),
      staleTime: Infinity,
      gcTime: 0,
    });
    await observer.refetch();
    const accepted = selectWindowProjection(
      scope,
      ['a', 'c'],
      observer.getCurrentResult(),
      retained.snapshot,
      false,
    );

    expect(accepted.data).toEqual([
      { entry_id: 'a', count: 3 },
      { entry_id: 'c', count: 0 },
    ]);
    expect(accepted.snapshot?.data).toEqual(accepted.data);
    unsubscribe();
    client.clear();
  });

  it('drops scope changes, revoked access and disabled projections before rendering retained data', () => {
    const previous = { scope, data };
    const failed = { data: undefined, isSuccess: false, isPlaceholderData: false };

    for (const changed of [
      ['private', 'other', 'meeting', 1, 'reactions'],
      ['private', 'user', 'other', 1, 'reactions'],
      ['private', 'user', 'meeting', 2, 'reactions'],
      ['private', 'user', 'meeting', 1, 'receipts'],
    ]) {
      expect(selectWindowProjection(changed, ['a'], failed, previous, false)).toEqual({
        data: undefined,
        snapshot: undefined,
      });
    }

    expect(
      selectWindowProjection(
        scope,
        ['a'],
        { data, isSuccess: true, isPlaceholderData: false },
        previous,
        true,
      ),
    ).toEqual({ data: undefined, snapshot: undefined });
    const receipts = [...scope.slice(0, 4), 'receipts', 'stream-one'];
    expect(
      selectWindowProjection(
        [...receipts.slice(0, -1), 'stream-two'],
        ['a'],
        failed,
        { scope: receipts, data },
        false,
      ),
    ).toEqual({ data: undefined, snapshot: undefined });
  });

  it('stores one bounded confirmed window, excluding unrequested entries and duplicates', () => {
    const selected = selectWindowProjection(
      scope,
      ['a'],
      { data: [...data, data[0]!], isSuccess: true, isPlaceholderData: false },
      undefined,
      false,
    );

    expect(selected.snapshot?.data).toEqual([data[0]]);
    const empty = selectWindowProjection(
      scope,
      ['a'],
      { data: [], isSuccess: true, isPlaceholderData: false },
      selected.snapshot,
      false,
    );

    expect(empty.snapshot?.data).toEqual([]);
    expect(
      selectWindowProjection(
        scope,
        ['a'],
        { data: undefined, isSuccess: false, isPlaceholderData: false },
        empty.snapshot,
        false,
      ).data,
    ).toEqual([]);
  });
});
