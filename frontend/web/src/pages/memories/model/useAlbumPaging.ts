import { useEffect } from 'react';
import type { useMemories } from '@/entities/meeting';

export const useAlbumPaging = (
  query: ReturnType<typeof useMemories>,
  index: number,
  count: number,
) => {
  useEffect(() => {
    if (query.hasNextPage && !query.isFetchingNextPage && !query.isFetchNextPageError) {
      void query.fetchNextPage();
    }
  }, [query, index, count]);
};
