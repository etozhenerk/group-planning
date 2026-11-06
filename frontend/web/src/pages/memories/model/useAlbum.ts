import { useLayoutEffect, useRef } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { useDesktopAlbum } from '@/pages/memories/model/useDesktopAlbum';
import { useMobileAlbum } from '@/pages/memories/model/useMobileAlbum';
import { photoMotionMetrics as vibeMetrics } from '@/shared/lib/photo-motion';

export const useAlbum = (count: number) => {
  const mobile = useMobileLayout();
  const desktop = useDesktopAlbum(count);
  const mobileAlbum = useMobileAlbum(count);
  const unusedElement = useRef<HTMLDivElement>(null);
  const active = mobile ? mobileAlbum : desktop;
  const restoreInactive = mobile ? desktop.restore : mobileAlbum.restore;
  useLayoutEffect(() => {
    restoreInactive(active.index, active.grid);
  }, [active.index, active.grid, restoreInactive]);

  return mobile
    ? mobileAlbum
    : {
        ...desktop,
        element: unusedElement,
        vertical: 0,
        phase: desktop.moving ? 'exiting' : 'idle',
        recycledIndex: null,
        duration: vibeMetrics.returning,
        progress: 0,
      };
};
