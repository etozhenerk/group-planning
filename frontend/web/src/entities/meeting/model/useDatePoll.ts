import { useQuery, useQueryClient } from '@tanstack/react-query';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import { getDatePoll } from '@/entities/meeting/api/datePoll';

export const useDatePoll = (meeting: string, id: string, user: string) => {
  const client = useQueryClient();
  const access = useAccess(user, meeting);
  const key = privateKey(user, meeting, access.epoch, `poll:${id}`);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      guarded(client, user, meeting, access.epoch, () =>
        getDatePoll(meeting, id, signal),
      ),
    enabled: !!user && !access.denied,
    retry: false,
    gcTime: 0,
    refetchInterval: (query) =>
      query.state.data &&
      ['applied', 'no_majority', 'cancelled'].includes(query.state.data.state)
        ? false
        : 3000,
    refetchOnWindowFocus: true,
  });

  return { ...query, access, key };
};
