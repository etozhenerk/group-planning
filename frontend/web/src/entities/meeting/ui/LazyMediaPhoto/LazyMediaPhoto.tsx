import type { Media } from '@/shared/api';
import { MediaPhoto } from '@/entities/meeting/ui/MediaPhoto';
import { useVisible } from '@/entities/meeting/ui/LazyMediaPhoto/hooks/useVisible';
import styles from '@/entities/meeting/ui/LazyMediaPhoto/LazyMediaPhoto.module.css';

export type LazyMediaPhotoProps = {
  media: Media;
  user: string;
  onOpen: () => void;
  openLabel: string;
};

export const LazyMediaPhoto = ({
  media,
  user,
  onOpen,
  openLabel,
}: LazyMediaPhotoProps) => {
  const cell = useVisible();

  return (
    <div ref={cell.ref} className={styles.frame}>
      {cell.visible && (
        <MediaPhoto media={media} user={user} onOpen={onOpen} openLabel={openLabel} />
      )}
    </div>
  );
};
