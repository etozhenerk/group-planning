import { QueryClient, QueryObserver } from '@tanstack/react-query';
import { describe, expect, it } from 'vitest';
import { retainWindowProjection } from '@/entities/meeting/lib/retainWindowProjection';

const scope = ['private', 'user', 'meeting', 1, 'reactions'] as const;
const data = [
  { entry_id: 'a', count: 1 },
  { entry_id: 'b', count: 2 },
];

describe('window projection continuity', () => {
  it('retains intersecting entries while the actual query observer changes range', async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const key = [...scope, 'a,b'];
    client.setQueryData(key, data);
    const gate: { finish?: (value: typeof data) => void } = {};

    const next = new Promise<typeof data>((resolve) => {
      gate.finish = resolve;
    });

    const observer = new QueryObserver(client, {
      queryKey: key,
      queryFn: () => next,
      staleTime: Infinity,
      gcTime: 0,
    });

    const unsubscribe = observer.subscribe(() => {});
    observer.setOptions({
      queryKey: [...scope, 'a,c'],
      queryFn: () => next,
      staleTime: Infinity,
      gcTime: 0,
      placeholderData: (previous, query) =>
        retainWindowProjection(scope, ['a', 'c'], previous, query?.queryKey, false),
    });
    expect(observer.getCurrentResult().isPlaceholderData).toBe(true);
    expect(observer.getCurrentResult().data).toEqual([data[0]]);
    gate.finish?.([
      { entry_id: 'a', count: 3 },
      { entry_id: 'c', count: 0 },
    ]);
    await observer.refetch();
    expect(observer.getCurrentResult().isPlaceholderData).toBe(false);
    expect(observer.getCurrentResult().data).toEqual([
      { entry_id: 'a', count: 3 },
      { entry_id: 'c', count: 0 },
    ]);
    unsubscribe();
    client.clear();
  });

  it.each([
    ['private', 'another-user', 'meeting', 1, 'reactions'],
    ['private', 'user', 'another-meeting', 1, 'reactions'],
    ['private', 'user', 'meeting', 2, 'reactions'],
    ['private', 'user', 'meeting', 1, 'receipts'],
  ])('never carries data across a different private scope %j', (...previousScope) => {
    expect(
      retainWindowProjection(scope, ['a'], data, [...previousScope, 'a,b'], false),
    ).toBeUndefined();
  });

  it('drops a revoked scope and absent previous data', () => {
    expect(
      retainWindowProjection(scope, ['a'], data, [...scope, 'a,b'], true),
    ).toBeUndefined();
    expect(retainWindowProjection(scope, ['a'], data, undefined, false)).toBeUndefined();
    expect(
      retainWindowProjection(scope, ['a'], undefined, [...scope, 'a'], false),
    ).toBeUndefined();
  });

  it('retains receipt counts across versions, but never across stream epochs', () => {
    const receipts = ['private', 'user', 'meeting', 1, 'receipts', 'stream-one'];
    expect(
      retainWindowProjection(receipts, ['a'], data, [...receipts, '10', 'a,b'], false),
    ).toEqual([data[0]]);
    expect(
      retainWindowProjection(
        receipts,
        ['a'],
        data,
        ['private', 'user', 'meeting', 1, 'receipts', 'stream-two', '11', 'a'],
        false,
      ),
    ).toBeUndefined();
  });
});
