import { useChatSyncEnabled } from '@/entities/meeting/model/useChatSyncEnabled';
import { z } from 'zod';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { request, writeOptions } from '@/shared/api';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import { entryReactionsSchema } from '@/entities/meeting/model/reactions';
import { retainWindowProjection } from '@/entities/meeting/lib/retainWindowProjection';

export const useReactions = (id: string, user: string, entries: string[]) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const sync = useChatSyncEnabled(user, access.epoch);
  const scope = privateKey(user, id, access.epoch, 'reactions');
  const query = useQuery<z.infer<typeof entryReactionsSchema>[]>({
    queryKey: [...scope, entries.join(',')],
    enabled: !!entries.length && !access.denied,
    placeholderData: (previous, previousQuery) =>
      retainWindowProjection(
        scope,
        entries,
        previous,
        previousQuery?.queryKey,
        access.denied,
      ),
    queryFn: ({ signal }) =>
      guarded(client, user, id, access.epoch, async () => {
        const values = [];

        for (let offset = 0; offset < entries.length; offset += 50) {
          const params = new URLSearchParams(
            entries.slice(offset, offset + 50).map((entry) => ['entry_id', entry]),
          );

          const result = await request(
            z.object({ entries: z.array(entryReactionsSchema) }),
            `/meetings/${id}/reactions?${params}`,
            { signal },
          );

          values.push(...result.entries);
        }

        return values;
      }),
    refetchInterval: sync ? false : 3000,
    refetchIntervalInBackground: false,
    staleTime: sync ? Infinity : 0,
    refetchOnWindowFocus: !sync,
    retry: false,
    gcTime: 0,
  });

  return query;
};

export const setReaction = (
  id: string,
  entry: string,
  emoji: string,
  active: boolean,
  csrf: string | null,
  key: string,
) =>
  request(
    entryReactionsSchema,
    `/meetings/${id}/messages/${entry}/reactions`,
    writeOptions('PUT', csrf, { emoji, active }, key),
  );
