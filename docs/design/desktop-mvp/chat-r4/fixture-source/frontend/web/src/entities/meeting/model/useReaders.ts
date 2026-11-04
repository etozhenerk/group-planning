import type { Conversation } from '@/entities/meeting/model/types';
import { useEffect, useRef } from 'react';
import { ApiError } from '@/shared/api';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { getChatReaders } from '@/entities/meeting/api/readState';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';

export const useReaders = (
  id: string,
  user: string,
  entry: string,
  version: string | undefined,
  enabled: boolean,
) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const stream = client.getQueryData<Conversation>(
    privateKey(user, id, access.epoch, 'feed'),
  )?.sync?.streamEpoch;

  const reset = useRef<string | undefined>(undefined);
  const key = [...privateKey(user, id, access.epoch, 'readers'), stream, entry, version];
  const scope = key.join(':');
  const query = useInfiniteQuery({
    queryKey: key,
    initialPageParam: undefined as string | undefined,
    enabled: enabled && !access.denied,
    queryFn: ({ pageParam, signal }) =>
      guarded(client, user, id, access.epoch, async () => {
        const result = await getChatReaders(id, entry, pageParam, signal);

        if (version && BigInt(result.projection_version) < BigInt(version)) {
          throw new Error('Stale reader projection');
        }

        return result;
      }),
    getNextPageParam: (page) => page.next_cursor ?? undefined,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  const expired = query.error instanceof ApiError && query.error.status === 410;
  useEffect(() => {
    if (enabled && expired && reset.current !== scope) {
      reset.current = scope;
      void client.resetQueries({
        queryKey: privateKey(user, id, access.epoch, 'readers'),
        type: 'active',
      });
    }
  }, [client, enabled, expired, scope, user, id, access.epoch]);

  return {
    ...query,
    expired,
    denied:
      access.denied || (query.error instanceof ApiError && query.error.status === 404),
  };
};
