import type { useMediaUpload } from '@/features/upload-media/model/useMediaUpload';
import { AlbumUploadSelection } from '@/features/upload-media/ui/AlbumUploadSelection';
import { AlbumUploadControls } from '@/features/upload-media/ui/AlbumUploadControls';
import styles from '@/features/upload-media/ui/AlbumUploadForm/AlbumUploadForm.module.css';

export type AlbumUploadFormProps = {
  upload: ReturnType<typeof useMediaUpload>;
  complete: boolean;
};

export const AlbumUploadForm = ({ upload, complete }: AlbumUploadFormProps) => {
  const items = upload.items.filter(
    (item) => complete || item.state !== 'done' || upload.busy,
  );

  const partial = !complete && upload.items.some((item) => item.state === 'done');

  return (
    <div className={styles.panel}>
      <div className={styles.body}>
        <AlbumUploadSelection
          items={items}
          busy={upload.busy}
          partial={partial}
          remove={upload.remove}
        />
        <AlbumUploadControls
          upload={upload}
          items={items}
          partial={partial}
          complete={complete}
        />
      </div>
    </div>
  );
};
