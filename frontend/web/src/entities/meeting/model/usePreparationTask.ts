import { useQuery, useQueryClient } from '@tanstack/react-query';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import { getPreparationTask } from '@/entities/meeting/api/preparationTask';

export const usePreparationTask = (meeting: string, id: string, user: string) => {
  const client = useQueryClient();
  const access = useAccess(user, meeting);
  const key = privateKey(user, meeting, access.epoch, `preparation-task:${id}`);
  const query = useQuery({
    queryKey: key,
    queryFn: ({ signal }) =>
      guarded(client, user, meeting, access.epoch, () =>
        getPreparationTask(meeting, id, signal),
      ),
    enabled: !!user && !access.denied,
    retry: false,
    gcTime: 0,
    refetchInterval: (query) =>
      query.state.data &&
      ['completed', 'declined', 'cancelled'].includes(query.state.data.state)
        ? false
        : 3000,
    refetchOnWindowFocus: true,
  });

  return { ...query, access };
};
