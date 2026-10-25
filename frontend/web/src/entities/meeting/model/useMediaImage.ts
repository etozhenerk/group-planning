import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { guarded, privateKey, useAccess } from '@/entities/meeting/model/access';
import { readMedia } from '@/entities/meeting/api/media';

export const useMediaImage = (id: string, media: string, user: string) => {
  const access = useAccess(user, id);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: [...privateKey(user, id, access.epoch, 'media'), media],
    queryFn: ({ signal }) =>
      guarded(client, user, id, access.epoch, () => readMedia(id, media, signal)),
    enabled: !!user && !access.denied,
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  const [object, setObject] = useState<{ blob: Blob; url: string } | null>(null);
  useEffect(() => {
    if (!query.data) {
      return;
    }

    const next = { blob: query.data, url: URL.createObjectURL(query.data) };
    setObject(next);

    return () => URL.revokeObjectURL(next.url);
  }, [query.data]);

  return {
    src: !access.denied && query.data === object?.blob ? object?.url : undefined,
    error: query.error,
    loading: query.isPending && !access.denied,
    retry: () => void query.refetch(),
  };
};
