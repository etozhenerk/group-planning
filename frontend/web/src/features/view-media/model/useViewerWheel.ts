import { useEffect } from 'react';
import type { RefObject } from 'react';
import { photoMotionMetrics as m } from '@/shared/lib/photo-motion';
import type { ViewerMotion } from '@/features/view-media/model/createViewerMotion';

export const useViewerWheel = (
  element: RefObject<HTMLDivElement | null>,
  motion: ViewerMotion,
  pointerActive: () => boolean,
  count: number,
  active: boolean,
) => {
  useEffect(() => {
    const el = element.current;

    if (!el || !active) {
      return;
    }

    let wheelActive = false;
    let total = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const wheel = (event: WheelEvent) => {
      const scale =
        event.deltaMode === 1 ? m.lineScale : event.deltaMode === 2 ? el.clientWidth : 1;

      const dx = (event.deltaX || (event.shiftKey ? event.deltaY : 0)) * scale;

      if (
        event.ctrlKey ||
        pointerActive() ||
        (!wheelActive &&
          Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY * scale))
      ) {
        return;
      }

      event.preventDefault();

      if (!wheelActive) {
        if (motion.read().phase !== 'idle') {
          return;
        }

        wheelActive = true;
        total = 0;
      }

      total = Math.max(-el.clientWidth, Math.min(el.clientWidth, total - dx));
      motion.drag(total);
      clearTimeout(timer);
      timer = setTimeout(() => {
        wheelActive = false;
        motion.finish(0, el.clientWidth);
      }, m.viewerQuiet);
    };

    el.addEventListener('wheel', wheel, { passive: false });

    return () => {
      el.removeEventListener('wheel', wheel);
      clearTimeout(timer);

      if (wheelActive && motion.read().phase === 'dragging') {
        motion.settle();
      }
    };
  }, [element, motion, pointerActive, count, active]);
};
