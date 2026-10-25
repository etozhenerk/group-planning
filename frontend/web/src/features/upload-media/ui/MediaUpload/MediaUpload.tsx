import type { Session } from '@/entities/session';
import { useMediaUpload } from '@/features/upload-media/model/useMediaUpload';
import { UploadActions } from '@/features/upload-media/ui/UploadActions';
import { UploadItemRow } from '@/features/upload-media/ui/UploadItemRow';
import { Status } from '@/shared/ui/Status';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import styles from '@/features/upload-media/ui/MediaUpload/MediaUpload.module.css';

export type MediaUploadProps = {
  id: string;
  session: Session;
  purpose: 'message' | 'memory';
  photo: boolean;
  done: () => void;
  initialFiles?: File[];
};

export const MediaUpload = ({
  id,
  session,
  purpose,
  photo,
  done,
  initialFiles = [],
}: MediaUploadProps) => {
  const upload = useMediaUpload(id, session, purpose, photo, initialFiles);

  if (upload.denied) {
    return <Status title="Доступ к встрече закрыт" />;
  }

  if (upload.limits.isPending) {
    return <SkeletonRows label="Подготовка загрузки" />;
  }

  if (!upload.limits.data) {
    return (
      <Status
        title="Не удалось подготовить загрузку"
        error
        action={() => void upload.limits.refetch()}
      />
    );
  }

  return (
    <div className={styles.upload}>
      {upload.error && <p role="alert">{upload.error}</p>}
      <ul className={styles.items} data-photo={photo}>
        {upload.items.map((item) => (
          <UploadItemRow
            key={item.id}
            item={item}
            remove={() => upload.remove(item.id)}
            retry={() => void upload.deliver(item)}
            caption={(value) => upload.caption(item.id, value)}
          />
        ))}
      </ul>
      <p className={styles.hint}>Видно участникам встречи</p>
      <UploadActions
        photo={photo}
        hasFiles={upload.items.length > 0}
        accept={(photo
          ? upload.limits.data.photo_types
          : upload.limits.data.file_types
        ).join(',')}
        choose={upload.choose}
        busy={upload.busy}
        ready={upload.items.some((item) => item.state === 'ready' && !item.error)}
        complete={
          upload.items.length > 0 && upload.items.every((item) => item.state === 'done')
        }
        memory={purpose === 'memory'}
        send={upload.upload}
        done={done}
      />
    </div>
  );
};
