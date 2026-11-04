import { useCallback, useMemo, useSyncExternalStore } from 'react';

export const useMediaQuery = (query: string): boolean => {
  const media = useMemo(() => window.matchMedia(query), [query]);
  const subscribe = useCallback(
    (listener: () => void) => {
      media.addEventListener('change', listener);

      return () => media.removeEventListener('change', listener);
    },
    [media],
  );

  const snapshot = useCallback(() => media.matches, [media]);

  return useSyncExternalStore(subscribe, snapshot);
};
