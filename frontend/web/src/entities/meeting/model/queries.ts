import { useInfiniteQuery, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getInvitation,
  getMeeting,
  getParticipants,
  listMeetings,
} from '@/entities/meeting/api/read';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';

export const useMeetings = (user: string) => {
  return useInfiniteQuery({
    queryKey: ['meetings', user],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) => listMeetings(pageParam, signal),
    getNextPageParam: (page) => page.nextCursor,
    enabled: !!user,
    retry: false,
  });
};

export const useInvitation = (token: string, user: string) => {
  return useQuery({
    queryKey: ['invitation', user, token],
    queryFn: ({ signal }) => getInvitation(token, signal),
    retry: false,
  });
};

export const useMeeting = (id: string, user: string) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const query = useQuery({
    queryKey: privateKey(user, id, access.epoch, 'details'),
    queryFn: ({ signal }) =>
      guarded(client, user, id, access.epoch, () => getMeeting(id, signal)),
    enabled: !!user && !access.denied,
    retry: false,
    gcTime: 0,
  });

  return { ...query, access };
};

export const useParticipants = (id: string, user: string, enabled = true) => {
  const client = useQueryClient();
  const access = useAccess(user, id);

  return useQuery({
    queryKey: privateKey(user, id, access.epoch, 'participants'),
    queryFn: ({ signal }) =>
      guarded(client, user, id, access.epoch, () => getParticipants(id, signal)),
    enabled: !!user && !access.denied && enabled,
    retry: false,
    gcTime: 0,
  });
};
