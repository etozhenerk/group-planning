import type { Media } from '@/shared/api';
import { MediaPhoto } from '@/entities/meeting/ui/MediaPhoto';
import styles from '@/entities/meeting/ui/MemoryPreview/MemoryPreview.module.css';

export type MemoryPreviewProps = { photos: Media[]; user: string; large?: boolean };

export const MemoryPreview = ({ photos, user, large = false }: MemoryPreviewProps) => (
  <span className={styles.stack} data-large={large} aria-hidden="true">
    {photos.slice(0, 3).map((photo) => (
      <span className={styles.photo} key={photo.id}>
        <MediaPhoto media={photo} user={user} passive />
      </span>
    ))}
  </span>
);
