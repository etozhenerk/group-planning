import type { CSSProperties } from 'react';
import type { Media } from '@/shared/api';
import { MediaPhoto } from '@/entities/meeting';
import styles from '@/features/view-media/ui/PhotoSlideTrack/PhotoSlideTrack.module.css';

export type PhotoSlideTrackProps = {
  media: Media;
  photos: Media[] | undefined;
  user: string;
  offset: number;
  phase: string;
};

export const PhotoSlideTrack = ({
  media,
  photos,
  user,
  offset,
  phase,
}: PhotoSlideTrackProps) => {
  const items = photos?.length ? photos : [media];
  const position = Math.max(
    0,
    items.findIndex((photo) => photo.id === media.id),
  );

  return (
    <div
      className={styles.track}
      data-phase={phase}
      style={{ '--offset': `${offset}px` } as CSSProperties}
    >
      {[-1, 0, 1].map((step) => {
        const photo = items[(position + step + items.length) % items.length] ?? media;

        return (
          <div key={step} className={styles.slide} aria-hidden={step !== 0}>
            <MediaPhoto media={photo} user={user} contain passive={step !== 0} />
          </div>
        );
      })}
    </div>
  );
};
