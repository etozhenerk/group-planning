import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { accessEpoch, privateKey, useAccess } from '@/entities/meeting';

export type UploadSelection = {
  files: File[];
  photo: boolean;
  purpose: 'message' | 'memory';
};

export const useUploadSelection = (user: string, id: string) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const key = privateKey(user, id, access.epoch, 'upload-selection');
  const clear = useCallback(() => {
    client.removeQueries({
      queryKey: privateKey(user, id, access.epoch, 'upload-selection'),
    });
  }, [client, user, id, access.epoch]);

  const selection = useQuery<UploadSelection | null>({
    queryKey: key,
    queryFn: () => null,
    initialData: null,
    enabled: false,
  });

  return {
    selection: selection.data,
    denied: access.denied,
    begin: (value: UploadSelection) => {
      if (!access.denied && accessEpoch(user, id) === access.epoch) {
        client.setQueryData(key, value);
      }
    },
    clear,
  };
};
