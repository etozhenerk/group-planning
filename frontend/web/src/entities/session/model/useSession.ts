import { useQuery } from '@tanstack/react-query';
import { getSession } from '@/entities/session/api/session';

export const useSession = ({
  refreshOnMount = false,
}: { refreshOnMount?: boolean } = {}) => {
  return useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) => getSession(signal),
    staleTime: 30_000,
    refetchOnMount: refreshOnMount ? 'always' : true,
    retry: false,
  });
};
