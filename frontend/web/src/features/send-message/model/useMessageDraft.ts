import { hashKey, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { accessEpoch, privateKey } from '@/entities/meeting';

export const useMessageDraft = (user: string, id: string, epoch: number) => {
  const client = useQueryClient();
  const key = useMemo(
    () => privateKey(user, id, epoch, 'message-draft'),
    [user, id, epoch],
  );

  const queryHash = hashKey(key);

  useQuery({
    queryKey: key,
    queryFn: () => '',
    initialData: '',
    enabled: false,
  });
  const subscribe = useCallback(
    (notify: () => void) =>
      client.getQueryCache().subscribe((event) => {
        if (event.query.queryHash === queryHash) {
          notify();
        }
      }),
    [client, queryHash],
  );

  const snapshot = useCallback(
    () => client.getQueryData<string>(key) ?? '',
    [client, key],
  );

  // Controlled input updates must be synchronous; the query observer batches notifications.
  // Keep that observer mounted so the draft retains the existing cache lifetime.
  const text = useSyncExternalStore(subscribe, snapshot);

  return {
    text,
    setText: (value: string) => {
      if (accessEpoch(user, id) === epoch) {
        client.setQueryData(key, value);
      }
    },
  };
};
