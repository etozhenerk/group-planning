import { Download } from 'lucide-react';
import { ButtonSpinner } from '@/shared/ui/ButtonSpinner';
import type { AlbumDownloadState } from '@/features/download-album/model/types';
import styles from '@/features/download-album/ui/DownloadAlbumButton/DownloadAlbumButton.module.css';

export type DownloadAlbumButtonProps = {
  state: AlbumDownloadState;
  start: () => void;
  cancel: () => void;
  mobile: boolean;
};

export const DownloadAlbumButton = ({
  state,
  start,
  cancel,
  mobile,
}: DownloadAlbumButtonProps) => {
  const preparing = state.phase === 'preparing';

  return (
    <button
      className={styles.button}
      data-mobile={mobile}
      type="button"
      onClick={preparing ? cancel : start}
      aria-label={
        preparing
          ? 'Отменить подготовку фотографий'
          : state.phase === 'error'
            ? 'Повторить скачивание всех фото'
            : 'Скачать все фото'
      }
    >
      {preparing ? <ButtonSpinner /> : <Download aria-hidden="true" />}
      <span>
        {preparing ? 'Отменить' : state.phase === 'error' ? 'Повторить' : 'Скачать все'}
      </span>
    </button>
  );
};
