import { Plus } from 'lucide-react';
import { useMobileLayout } from '@/shared/lib/media';
import { DownloadAlbumButton } from '@/features/download-album';
import type { useAlbumDownload } from '@/features/download-album';
import styles from '@/pages/memories/ui/AlbumActions/AlbumActions.module.css';

export type AlbumActionsProps = {
  upload: () => void;
  disabled: boolean;
  canDownload: boolean;
  download: ReturnType<typeof useAlbumDownload>;
};

export const AlbumActions = ({
  upload,
  disabled,
  canDownload,
  download,
}: AlbumActionsProps) => {
  const mobile = useMobileLayout();

  return (
    <div
      className={styles.actions}
      data-mobile={mobile}
      role="group"
      aria-label="Действия с альбомом"
    >
      <button
        className={styles.upload}
        type="button"
        onClick={upload}
        disabled={disabled}
      >
        <Plus aria-hidden="true" />
        <span>Добавить фото</span>
      </button>
      {canDownload && <DownloadAlbumButton {...download} mobile={mobile} />}
    </div>
  );
};
