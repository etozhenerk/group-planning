import type { Session } from '@/entities/session';
import { useMediaUpload } from '@/features/upload-media/model/useMediaUpload';
import { useUploadCompletion } from '@/features/upload-media/ui/MediaUpload/hooks/useUploadCompletion';
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
  active?: boolean;
};

export const MediaUpload = ({
  id,
  session,
  purpose,
  photo,
  done,
  initialFiles = [],
  active = true,
}: MediaUploadProps) => {
  const upload = useMediaUpload(id, session, purpose, photo, initialFiles);
  const complete =
    upload.items.length > 0 && upload.items.every((item) => item.state === 'done');

  useUploadCompletion(complete, active, done);
  const failures = upload.items.filter((item) => item.state === 'failed');

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
        {upload.items
          .filter((item) => complete || item.state !== 'done' || upload.busy)
          .map((item) => (
            <UploadItemRow
              key={item.id}
              item={item}
              remove={() => upload.remove(item.id)}
              busy={upload.busy}
              caption={(value) => upload.caption(item.id, value)}
            />
          ))}
      </ul>
      {!upload.busy && failures.length > 0 && (
        <p role="alert">
          {failures[0]?.error} Повторная отправка добавит только неотправленные файлы.
        </p>
      )}
      <p className={styles.hint}>Видно участникам встречи</p>
      <UploadActions
        photo={photo}
        hasFiles={upload.items.length > 0}
        accept={(photo
          ? upload.limits.data.photo_types
          : upload.limits.data.file_types
        ).join(',')}
        choose={upload.choose}
        busy={upload.busy || complete}
        retry={failures.length > 0}
        ready={upload.items.some(
          (item) => item.state === 'failed' || (item.state === 'ready' && !item.error),
        )}
        memory={purpose === 'memory'}
        send={upload.upload}
      />
    </div>
  );
};
