import type { Conversation } from '@/entities/meeting/model/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryChatReceipts } from '@/entities/meeting/api/readState';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import { retainWindowProjection } from '@/entities/meeting/lib/retainWindowProjection';

export const useReadReceipts = (
  id: string,
  user: string,
  csrf: string | null,
  entries: string[],
  version: string | undefined,
  enabled: boolean,
) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const stream = client.getQueryData<Conversation>(
    privateKey(user, id, access.epoch, 'feed'),
  )?.sync?.streamEpoch;

  const scope = [...privateKey(user, id, access.epoch, 'receipts'), stream];

  return useQuery<Awaited<ReturnType<typeof queryChatReceipts>>['receipts']>({
    queryKey: [...scope, version, entries.join(',')],
    enabled: enabled && !access.denied && entries.length > 0,
    placeholderData: (previous, previousQuery) =>
      retainWindowProjection(
        scope,
        entries,
        previous,
        previousQuery?.queryKey,
        access.denied || !enabled,
      ),
    queryFn: ({ signal }) =>
      guarded(client, user, id, access.epoch, async () => {
        const receipts = [];

        for (let offset = 0; offset < entries.length; offset += 100) {
          const result = await queryChatReceipts(
            id,
            entries.slice(offset, offset + 100),
            csrf,
            signal,
          );

          if (version && BigInt(result.projection_version) < BigInt(version)) {
            throw new Error('Stale receipt projection');
          }

          receipts.push(...result.receipts);
        }

        return receipts;
      }),
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });
};
