import { useEffect, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guarded, readMedia, useAccess } from '@/entities/meeting';
import type { Media } from '@/shared/api';

export const useDownload = (media: Media, user: string) => {
  const client = useQueryClient();
  const access = useAccess(user, media.meeting_id);
  const controllers = useRef(new Set<AbortController>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const pending = controllers.current;

    return () => {
      alive.current = false;
      pending.forEach((controller) => controller.abort());
      pending.clear();
    };
  }, [media.id, access.epoch]);

  return useMutation({
    mutationFn: async () => {
      const controller = new AbortController();
      controllers.current.add(controller);

      try {
        return await guarded(client, user, media.meeting_id, access.epoch, () =>
          readMedia(media.meeting_id, media.id, controller.signal),
        );
      } finally {
        controllers.current.delete(controller);
      }
    },
    onSuccess: (blob) => {
      if (!alive.current || access.denied) {
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = media.file_name;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    retry: false,
  });
};
