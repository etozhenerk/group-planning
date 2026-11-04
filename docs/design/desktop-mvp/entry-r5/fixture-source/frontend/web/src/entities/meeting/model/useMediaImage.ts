import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccess } from '@/entities/meeting/model/access';
import { mediaImageOptions } from '@/entities/meeting/model/mediaImageOptions';

export const useMediaImage = (id: string, media: string, user: string) => {
  const access = useAccess(user, id);
  const client = useQueryClient();
  const query = useQuery({
    ...mediaImageOptions(client, user, id, access.epoch, media),
    enabled: !!user && !access.denied,
  });

  return {
    src: access.denied ? undefined : query.data?.url,
    error: query.error,
    loading: query.isPending && !access.denied,
    retry: () => void query.refetch(),
  };
};
