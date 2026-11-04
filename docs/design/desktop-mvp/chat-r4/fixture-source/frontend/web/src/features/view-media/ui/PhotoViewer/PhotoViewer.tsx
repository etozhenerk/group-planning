import { usePhotoGesture } from '@/features/view-media/model/usePhotoGesture';
import { useLayoutEffect, useRef } from 'react';
import { lockBackgroundScroll } from '@/shared/lib/lockBackgroundScroll';
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
};

export const PhotoViewer = ({
  media,
  user,
  close,
  change,
  index,
  count,
}: PhotoViewerProps) => {
  const gesture = usePhotoGesture(change);
  const ref = useRef<HTMLDialogElement>(null);
  useLayoutEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    const previous = document.activeElement;
    const fallback = previous?.parentElement?.closest<HTMLElement>('[tabindex]');
    dialog.showModal();
    const unlock = lockBackgroundScroll(dialog);

    return () => {
      dialog.close();
      unlock();
      const target = previous?.isConnected ? previous : fallback;

      if (
        target instanceof HTMLElement &&
        target.isConnected &&
        !document.querySelector('dialog[open]')
      ) {
        target.focus({ preventScroll: true });
      }
    };
  }, []);

  return (
    <dialog
      className={styles.viewer}
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
        onPointerDown={gesture.down}
        onPointerUp={gesture.up}
        onPointerCancel={gesture.cancel}
      >
        <MediaPhoto media={media} user={user} contain />
      </div>
    </dialog>
  );
};
