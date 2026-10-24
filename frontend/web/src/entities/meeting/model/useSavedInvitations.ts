import { useInfiniteQuery } from '@tanstack/react-query';
import { listSavedInvitations } from '@/entities/meeting/api/savedInvitations';

export const useSavedInvitations = (user: string) =>
  useInfiniteQuery({
    queryKey: ['saved-invitations', user],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => listSavedInvitations(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
    enabled: !!user,
    refetchOnMount: 'always',
    refetchOnWindowFocus: 'always',
    retry: false,
  });
