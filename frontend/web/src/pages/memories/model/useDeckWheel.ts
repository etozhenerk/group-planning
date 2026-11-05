import { useEffect } from 'react';
import type { RefObject } from 'react';
import type { DeckMotion } from '@/pages/memories/model/createDeckMotion';
import { photoMotionMetrics as m } from '@/shared/lib/photo-motion';

export const useDeckWheel = (
  element: RefObject<HTMLDivElement | null>,
  motion: DeckMotion,
  pointerActive: () => boolean,
  count: number,
  grid: boolean,
) => {
  useEffect(() => {
    const deck = element.current;

    if (!deck || grid || !count) {
      return;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    let active = false;
    let consumed = false;
    let total = 0;
    let lastTime = 0;
    let velocity = 0;
    const width = () =>
      deck.querySelector('[data-front="true"]')?.getBoundingClientRect().width ??
      deck.clientWidth;

    const finish = () => {
      if (!active || consumed) {
        active = false;
        consumed = false;

        return;
      }

      active = false;
      motion.finish(total, velocity, width());
    };

    const wheel = (event: WheelEvent) => {
      if (event.ctrlKey || pointerActive()) {
        return;
      }

      const scale =
        event.deltaMode === 1
          ? m.lineScale
          : event.deltaMode === 2
            ? deck.clientWidth
            : 1;

      const dx = (event.deltaX || (event.shiftKey ? event.deltaY : 0)) * scale;

      if (
        !active &&
        Math.abs(dx) <= Math.abs(event.shiftKey ? 0 : event.deltaY * scale)
      ) {
        return;
      }

      event.preventDefault();
      clearTimeout(timer);

      if (!active) {
        if (motion.read().phase !== 'idle') {
          return;
        }

        active = true;
        consumed = false;
        total = 0;
        velocity = 0;
        lastTime = 0;
        motion.blockTap();
        motion.drag(0);
      }

      if (consumed) {
        timer = setTimeout(() => {
          active = false;
          consumed = false;
        }, m.consumedQuiet);

        return;
      }

      velocity = lastTime
        ? m.previousWeight * velocity +
          (m.latestWeight * -dx) / Math.max(m.velocitySample, event.timeStamp - lastTime)
        : 0;
      lastTime = event.timeStamp;
      total = Math.max(-deck.clientWidth, Math.min(deck.clientWidth, total - dx));
      motion.drag(total);

      if (Math.abs(total) > deck.clientWidth * m.wheelCommit && count > 1) {
        consumed = true;
        motion.exit(
          Math.sign(total),
          (motion.read().index + 1) % count,
          velocity,
          motion.read().index === count - 1,
          width(),
        );
        timer = setTimeout(() => {
          active = false;
          consumed = false;
        }, m.consumedQuiet);
      } else {
        timer = setTimeout(finish, m.quiet);
      }
    };

    deck.addEventListener('wheel', wheel, { passive: false });

    return () => {
      deck.removeEventListener('wheel', wheel);

      if (active && !consumed && motion.read().phase === 'dragging') {
        motion.settle();
      }

      clearTimeout(timer);
    };
  }, [element, motion, pointerActive, count, grid]);
};
