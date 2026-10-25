import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accessEpoch, privateKey } from '@/entities/meeting';

export const useMessageDraft = (user: string, id: string, epoch: number) => {
  const client = useQueryClient();
  const key = privateKey(user, id, epoch, 'message-draft');
  const draft = useQuery({
    queryKey: key,
    queryFn: () => '',
    initialData: '',
    enabled: false,
  });

  return {
    text: draft.data,
    setText: (value: string) => {
      if (accessEpoch(user, id) === epoch) {
        client.setQueryData(key, value);
      }
    },
  };
};
