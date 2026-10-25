import { useCallback, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accessEpoch, privateKey } from '@/entities/meeting';
import type { PendingMessage } from '@/features/send-message/model/types';

export const usePendingMessages = (user: string, id: string, epoch: number) => {
  const client = useQueryClient();
  const query = useQuery<PendingMessage[]>({
    queryKey: privateKey(user, id, epoch, 'pending-messages'),
    queryFn: () => [],
    initialData: [],
    enabled: false,
  });

  const update = useCallback(
    (change: (value: PendingMessage[]) => PendingMessage[]) => {
      if (accessEpoch(user, id) === epoch) {
        const key = privateKey(user, id, epoch, 'pending-messages');
        const previous = client.getQueryData<PendingMessage[]>(key) ?? [];
        const next = change(previous);

        if (next !== previous) {
          client.setQueryData(key, next);
        }
      }
    },
    [client, user, id, epoch],
  );

  useEffect(
    () => () => {
      const key = privateKey(user, id, epoch, 'pending-messages');
      const values = client.getQueryData<PendingMessage[]>(key);

      if (values?.some((value) => value.state === 'sending')) {
        client.setQueryData(
          key,
          values.map((value) =>
            value.state === 'sending' ? { ...value, state: 'failed' } : value,
          ),
        );
      }
    },
    [client, user, id, epoch],
  );

  return { pending: query.data, setPending: update };
};
