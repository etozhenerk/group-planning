import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import { getMemories } from '@/entities/meeting/api/media';

export const useMemories = (id: string, user: string) => {
  const access = useAccess(user, id);
  const client = useQueryClient();
  const query = useInfiniteQuery({
    queryKey: privateKey(user, id, access.epoch, 'memories'),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      guarded(client, user, id, access.epoch, () => getMemories(id, pageParam, signal)),
    getNextPageParam: (page) => page.next_cursor,
    enabled: !!user && !access.denied,
    retry: false,
    gcTime: 0,
  });

  return { ...query, access };
};
