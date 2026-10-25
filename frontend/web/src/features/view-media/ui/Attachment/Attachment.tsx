import { useSearchParams } from 'react-router';
import { FileDown } from 'lucide-react';
import type { Media } from '@/shared/api';
import { MediaPhoto } from '@/entities/meeting';
import { PhotoViewer } from '@/features/view-media/ui/PhotoViewer';
import { useDownload } from '@/features/view-media/model/useDownload';
import styles from '@/features/view-media/ui/Attachment/Attachment.module.css';

export type AttachmentProps = { media: Media; user: string };

export const Attachment = ({ media, user }: AttachmentProps) => {
  const [params, setParams] = useSearchParams();
  const open = params.get('attachment') === media.id;
  const setOpen = (value: boolean) => {
    const next = new URLSearchParams(params);

    if (value) {
      next.set('attachment', media.id);
    } else {
      next.delete('attachment');
    }

    setParams(next, { replace: !value });
  };

  const download = useDownload(media, user);

  return (
    <div className={styles.attachment}>
      {media.kind === 'photo' ? (
        <div className={styles.photo}>
          <MediaPhoto media={media} user={user} onOpen={() => setOpen(true)} />
        </div>
      ) : (
        <button
          type="button"
          className={styles.file}
          disabled={download.isPending}
          onClick={() => download.mutate()}
        >
          <FileDown size={22} />
          <span>
            {media.file_name}
            <small>{(media.size_bytes / 1024 / 1024).toFixed(1)} МБ</small>
          </span>
        </button>
      )}
      {download.error && (
        <button type="button" onClick={() => download.mutate()}>
          Не удалось скачать. Повторить
        </button>
      )}
      {open && media.kind === 'photo' && (
        <PhotoViewer
          media={media}
          user={user}
          index={0}
          count={1}
          close={() => setOpen(false)}
          change={() => undefined}
        />
      )}
    </div>
  );
};
