import { useLayoutEffect, useRef } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { lockBackgroundScroll } from '@/shared/lib/lockBackgroundScroll';
import { useViewerSlide } from '@/features/view-media/model/useViewerSlide';
import { useDesktopPhotoGesture } from '@/features/view-media/model/useDesktopPhotoGesture';
import type { PhotoViewerProps } from '@/features/view-media/ui/PhotoViewer/PhotoViewer';

export const usePhotoViewerSurface = ({ count, change, media }: PhotoViewerProps) => {
  const mobile = useMobileLayout();
  const desktopGesture = useDesktopPhotoGesture(change);
  const slide = useViewerSlide(count, change, media.id, mobile);
  const gesture = mobile ? slide : desktopGesture;
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

  return { mobile, gesture, slide, ref };
};
