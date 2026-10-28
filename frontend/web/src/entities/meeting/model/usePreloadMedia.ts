import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Media } from '@/shared/api';
import { useAccess } from '@/entities/meeting/model/access';
import { mediaImageOptions } from '@/entities/meeting/model/mediaImageOptions';

export const usePreloadMedia = (id: string, user: string, photos: Media[]) => {
  const client = useQueryClient();
  const { epoch, denied } = useAccess(user, id);
  useEffect(() => {
    if (!user || denied) {
      return;
    }

    let stopped = false;
    let index = 0;
    const work = async () => {
      while (!stopped && index < photos.length) {
        const photo = photos[index++];

        if (photo) {
          await client.prefetchQuery(
            mediaImageOptions(client, user, id, epoch, photo.id),
          );
        }
      }
    };

    for (let worker = 0; worker < 3; worker += 1) {
      void work();
    }

    return () => {
      stopped = true;
    };
  }, [client, id, user, epoch, denied, photos]);
};
