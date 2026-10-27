import { useQuery } from '@tanstack/react-query';
import { getChatCapabilities } from '@/entities/meeting/api/chat';

export const useChatSyncEnabled = (user: string, epoch: number) => {
  const query = useQuery({
    queryKey: ['chat-capabilities', user, epoch],
    queryFn: ({ signal }) => getChatCapabilities(signal),
    enabled: !!user,
    staleTime: 30_000,
    retry: false,
  });

  return query.data?.sync === true;
};
