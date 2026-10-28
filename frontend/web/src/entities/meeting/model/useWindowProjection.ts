import { useLayoutEffect, useRef } from 'react';
import { selectWindowProjection } from '@/entities/meeting/lib/retainWindowProjection';
import type { WindowProjectionSnapshot } from '@/entities/meeting/lib/retainWindowProjection';

export const useWindowProjection = <T extends { entry_id: string }>(
  scope: readonly unknown[],
  entries: readonly string[],
  query: { data: T[] | undefined; isSuccess: boolean; isPlaceholderData: boolean },
  denied: boolean,
) => {
  const previous = useRef<WindowProjectionSnapshot<T> | undefined>(undefined);
  const selected = selectWindowProjection(
    scope,
    entries,
    query,
    previous.current,
    denied,
  );

  useLayoutEffect(() => {
    previous.current = selected.snapshot;
  });

  return selected.data;
};
