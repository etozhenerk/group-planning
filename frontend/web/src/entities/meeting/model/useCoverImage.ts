import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAccess, guarded, privateKey } from '@/entities/meeting/model/access';
import { readCover } from '@/entities/meeting/api/cover';
import { safeCoverURL } from '@/entities/meeting/lib/coverURL';

export const useCoverImage = (raw: string | null, meeting: string, user: string) => {
  const url = safeCoverURL(raw, location.origin, meeting);
  const privateImage = !!url?.includes('/api/v1/meetings/');
  const access = useAccess(user, meeting);
  const client = useQueryClient();
  const query = useQuery({
    queryKey: privateImage
      ? [...privateKey(user, meeting, access.epoch, 'cover'), url]
      : ['public-cover', url],
    enabled: !!url && (!privateImage || (!!user && !access.denied)),
    queryFn: ({ signal }) => {
      if (!url) {
        throw new Error('Missing cover');
      }

      return privateImage
        ? guarded(client, user, meeting, access.epoch, () => readCover(url, signal))
        : readCover(url, signal);
    },
    staleTime: Infinity,
    gcTime: 0,
    retry: false,
  });

  const [object, setObject] = useState<{ blob: Blob; url: string } | null>(null);
  useEffect(() => {
    if (!query.data) {
      return;
    }

    const value = { blob: query.data, url: URL.createObjectURL(query.data) };
    setObject(value);

    return () => URL.revokeObjectURL(value.url);
  }, [query.data]);

  return {
    src:
      (!privateImage || !access.denied) && query.data === object?.blob
        ? object?.url
        : undefined,
    loading: !!url && query.isPending && (!privateImage || (!!user && !access.denied)),
  };
};
