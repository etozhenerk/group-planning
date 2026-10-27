import { useQuery } from '@tanstack/react-query';
import { privateKey } from '@/entities/meeting';
import type { PendingMessage } from '@/features/send-message/model/types';

export const usePendingMessages = (user: string, id: string, epoch: number) => {
  const query = useQuery<PendingMessage[]>({
    queryKey: privateKey(user, id, epoch, 'pending-messages'),
    queryFn: () => [],
    initialData: [],
    enabled: false,
  });

  return { pending: query.data };
};
