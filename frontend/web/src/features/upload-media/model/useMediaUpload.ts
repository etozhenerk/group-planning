import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getMediaLimits,
  guarded,
  reserveMedia,
  uploadMedia,
  publishMedia,
  useAccess,
} from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { uploadProblem } from '@/features/upload-media/lib/uploadProblem';
import { validateFile } from '@/features/upload-media/lib/validateFile';
import type { UploadItem } from '@/features/upload-media/model/types';

export const useMediaUpload = (
  id: string,
  session: Session,
  purpose: 'message' | 'memory',
  photo: boolean,
  initialFiles: File[],
) => {
  const client = useQueryClient();
  const access = useAccess(session.user.id, id);
  const limits = useQuery({
    queryKey: ['media-limits', id],
    queryFn: ({ signal }) => getMediaLimits(id, signal),
    retry: false,
  });

  const [items, setItems] = useState<UploadItem[]>([]);
  const [error, setError] = useState('');
  const controllers = useRef(new Map<string, AbortController>());
  const previews = useRef(new Set<string>());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    const pending = controllers.current;
    const urls = previews.current;

    return () => {
      alive.current = false;
      pending.forEach((value) => value.abort());
      urls.forEach((url) => URL.revokeObjectURL(url));
      urls.clear();
    };
  }, [id, access.epoch]);
  const update = (key: string, patch: Partial<UploadItem>) => {
    if (alive.current) {
      setItems((previous) =>
        previous.map((item) => (item.id === key ? { ...item, ...patch } : item)),
      );
    }
  };

  const choose = useCallback(
    (files: FileList | File[] | null) => {
      if (!files || !limits.data) {
        return;
      }

      if (files.length + items.length > limits.data.max_files) {
        setError(`Можно выбрать до ${limits.data.max_files} файлов.`);

        return;
      }

      const next = Array.from(files).map((file) => {
        const issue = validateFile(file, limits.data, photo);
        const preview =
          !issue && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;

        if (preview) {
          previews.current.add(preview);
        }

        return {
          id: crypto.randomUUID(),
          publishKey: crypto.randomUUID(),
          file,
          caption: '',
          preview,
          mediaId: null,
          state: 'ready' as const,
          progress: 0,
          error: issue,
        };
      });

      setItems((previous) => [...previous, ...next]);
      setError('');
    },
    [items.length, limits.data, photo],
  );

  const initialized = useRef<File[] | null>(null);
  useEffect(() => {
    if (initialized.current !== initialFiles && limits.data && initialFiles.length) {
      initialized.current = initialFiles;
      choose(initialFiles);
    }
  }, [choose, initialFiles, limits.data]);

  const remove = (key: string) => {
    controllers.current.get(key)?.abort();
    const item = items.find((value) => value.id === key);

    if (item?.preview) {
      URL.revokeObjectURL(item.preview);
      previews.current.delete(item.preview);
    }

    setItems((previous) => previous.filter((value) => value.id !== key));
  };

  const deliver = async (item: UploadItem) => {
    if (
      item.state === 'done' ||
      item.state === 'uploading' ||
      (item.error && item.state === 'ready') ||
      access.denied
    ) {
      return;
    }

    const controller = new AbortController();
    controllers.current.set(item.id, controller);
    update(item.id, { state: 'uploading', error: '', progress: 0 });

    try {
      await guarded(client, session.user.id, id, access.epoch, async () => {
        const mediaId =
          item.mediaId ??
          (
            await reserveMedia(
              id,
              item.file,
              purpose,
              item.id,
              session.csrf,
              controller.signal,
            )
          ).media.id;

        update(item.id, { mediaId });
        await uploadMedia(
          id,
          mediaId,
          item.file,
          session.csrf,
          controller.signal,
          (value) => update(item.id, { progress: value }),
        );
        await publishMedia(
          id,
          mediaId,
          item.publishKey,
          session.csrf,
          controller.signal,
          item.caption,
        );
      });
      update(item.id, { state: 'done', progress: 100 });
      void client.invalidateQueries({ queryKey: ['private', session.user.id, id] });
      void client.invalidateQueries({ queryKey: ['meetings', session.user.id] });
    } catch (cause) {
      if (!controller.signal.aborted) {
        update(item.id, { state: 'failed', error: uploadProblem(cause) });
      }
    } finally {
      controllers.current.delete(item.id);
    }
  };

  return {
    items,
    limits,
    error,
    choose,
    remove,
    caption: (key: string, value: string) => update(key, { caption: value }),
    deliver,
    denied: access.denied,
    upload: () =>
      items
        .filter((item) => item.state === 'ready' && !item.error)
        .forEach((item) => void deliver(item)),
    busy: items.some((item) => item.state === 'uploading'),
  };
};
