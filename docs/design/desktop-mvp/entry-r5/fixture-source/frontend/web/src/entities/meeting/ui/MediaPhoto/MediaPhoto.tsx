import type { Media } from '@/shared/api';
import { useMediaImage } from '@/entities/meeting/model/useMediaImage';
import styles from '@/entities/meeting/ui/MediaPhoto/MediaPhoto.module.css';

export type MediaPhotoProps = {
  media: Media;
  user: string;
  contain?: boolean;
  onOpen?: (() => void) | undefined;
  openLabel?: string;
  passive?: boolean;
};

export const MediaPhoto = ({
  media,
  user,
  contain = false,
  onOpen,
  openLabel,
  passive = false,
}: MediaPhotoProps) => {
  const image = useMediaImage(media.meeting_id, media.id, user);

  return (
    <div className={styles.frame} aria-busy={image.loading}>
      {image.src ? (
        <>
          <img
            className={contain ? styles.contain : styles.image}
            src={image.src}
            alt={media.file_name}
            draggable={false}
          />
          {onOpen && (
            <button
              type="button"
              className={styles.open}
              onClick={onOpen}
              aria-label={openLabel ?? `Открыть фото ${media.file_name}`}
            />
          )}
        </>
      ) : image.error ? (
        passive ? (
          <span>Фото недоступно</span>
        ) : (
          <button type="button" onClick={image.retry}>
            Повторить загрузку фото
          </button>
        )
      ) : (
        <div className={styles.loading} role="status" aria-label="Загрузка фото" />
      )}
    </div>
  );
};
