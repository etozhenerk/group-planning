import { useQuery } from '@tanstack/react-query';
import { getSession } from '@/entities/session/api/session';

export const useSession = () => {
  return useQuery({
    queryKey: ['session'],
    queryFn: ({ signal }) => getSession(signal),
    staleTime: 30_000,
    retry: false,
  });
};
