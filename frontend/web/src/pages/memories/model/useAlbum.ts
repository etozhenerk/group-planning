import { useRef } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { useDesktopAlbum } from '@/pages/memories/model/useDesktopAlbum';
import { useMobileAlbum } from '@/pages/memories/model/useMobileAlbum';
import { photoMotionMetrics as vibeMetrics } from '@/shared/lib/photo-motion';

export const useAlbum = (count: number) => {
  const mobile = useMobileLayout();
  const desktop = useDesktopAlbum(count);
  const refreshed = useMobileAlbum(count);
  const unusedElement = useRef<HTMLDivElement>(null);

  return mobile
    ? refreshed
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
