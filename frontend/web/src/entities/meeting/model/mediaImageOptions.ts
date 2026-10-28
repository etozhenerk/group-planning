import { queryOptions, type QueryClient } from '@tanstack/react-query';
import { guarded, privateKey } from '@/entities/meeting/model/access';
import { readMedia } from '@/entities/meeting/api/media';

const registered = new WeakSet<QueryClient>();

export const mediaImageOptions = (
  client: QueryClient,
  user: string,
  id: string,
  epoch: number,
  media: string,
) => {
  if (!registered.has(client)) {
    registered.add(client);
    client.getQueryCache().subscribe((event) => {
      if (event.type === 'removed' && event.query.meta?.privateImage === true) {
        const data = event.query.state.data as { url: string } | undefined;

        if (data) {
          URL.revokeObjectURL(data.url);
        }
      }
    });
  }

  return queryOptions({
    queryKey: [...privateKey(user, id, epoch, 'media'), media],
    queryFn: async ({ signal }) => {
      let url: string | undefined;

      try {
        return await guarded(client, user, id, epoch, async () => {
          const cached = client.getQueryData<{ url: string }>([
            ...privateKey(user, id, epoch, 'media'),
            media,
          ]);

          if (cached) {
            return cached;
          }

          const blob = await readMedia(id, media, signal);
          signal.throwIfAborted();
          url = URL.createObjectURL(blob);
          const image = new Image();
          image.src = url;
          await image.decode();
          signal.throwIfAborted();

          return { url };
        });
      } catch (error) {
        if (url) {
          URL.revokeObjectURL(url);
        }

        throw error;
      }
    },
    meta: { privateImage: true },
    staleTime: Infinity,
    gcTime: 5 * 60 * 1000,
    retry: false,
  });
};
