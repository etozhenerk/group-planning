import { usePhotoViewerSurface } from '@/features/view-media/ui/PhotoViewer/hooks/usePhotoViewerSurface';
import { PhotoSlideTrack } from '@/features/view-media/ui/PhotoSlideTrack';
import { PhotoHeading } from '@/features/view-media/ui/PhotoHeading';
import type { Media } from '@/shared/api';
import { MediaPhoto } from '@/entities/meeting';
import styles from '@/features/view-media/ui/PhotoViewer/PhotoViewer.module.css';

export type PhotoViewerProps = {
  media: Media;
  user: string;
  close: () => void;
  change: (step: -1 | 1) => void;
  index: number;
  count: number;
  photos?: Media[] | undefined;
};

export const PhotoViewer = ({
  media,
  user,
  close,
  change,
  index,
  count,
  photos,
}: PhotoViewerProps) => {
  const { mobile, gesture, slide, ref } = usePhotoViewerSurface({
    media,
    user,
    close,
    change,
    index,
    count,
    photos,
  });

  return (
    <dialog
      className={styles.viewer}
      data-mobile={mobile}
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      aria-label="Фото встречи"
      onKeyDown={gesture.key}
    >
      <PhotoHeading media={media} user={user} index={index} count={count} close={close} />
      <div
        className={styles.photo}
        data-mobile={mobile}
        ref={mobile ? slide.element : undefined}
        data-testid="full-photo"
        onPointerMove={mobile ? slide.move : undefined}
        onLostPointerCapture={mobile ? slide.lostCapture : undefined}
        onPointerDown={gesture.down}
        onPointerUp={gesture.up}
        onPointerCancel={gesture.cancel}
      >
        {mobile ? (
          <PhotoSlideTrack
            media={media}
            photos={photos}
            user={user}
            offset={slide.offset}
            phase={slide.phase}
          />
        ) : (
          <MediaPhoto media={media} user={user} contain />
        )}
      </div>
    </dialog>
  );
};
