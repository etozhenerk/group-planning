import type { AlbumDownloadState } from '@/features/download-album/model/types';
import styles from '@/features/download-album/ui/DownloadAlbumFeedback/DownloadAlbumFeedback.module.css';

export type DownloadAlbumFeedbackProps = { state: AlbumDownloadState };

export const DownloadAlbumFeedback = ({ state }: DownloadAlbumFeedbackProps) => {
  if (state.phase !== 'error' && state.phase !== 'started') {
    return null;
  }

  return (
    <p
      className={styles.feedback}
      data-error={state.phase === 'error'}
      role={state.phase === 'error' ? 'alert' : 'status'}
    >
      {state.phase === 'error'
        ? 'Не удалось подготовить фотографии. Попробуйте ещё раз.'
        : 'Скачивание началось'}
    </p>
  );
};
