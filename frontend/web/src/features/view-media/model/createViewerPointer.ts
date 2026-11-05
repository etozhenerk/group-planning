import type { PointerEvent } from 'react';
import { photoMotionMetrics as m } from '@/shared/lib/photo-motion';
import type { ViewerMotion } from '@/features/view-media/model/createViewerMotion';

export const createViewerPointer = (motion: ViewerMotion) => {
  let pointer: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    time: number;
    velocity: number;
    horizontal: boolean;
  } | null = null;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer && pointer.id !== event.pointerId) {
      pointer = null;
      motion.settle();

      return;
    }

    if (event.button !== 0 || motion.read().phase !== 'idle') {
      return;
    }

    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      time: event.timeStamp,
      velocity: 0,
      horizontal: false,
    };
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const p = pointer;

    if (!p || p.id !== event.pointerId) {
      return;
    }

    const dx = event.clientX - p.x;
    const dy = event.clientY - p.y;

    if (!p.horizontal) {
      if (Math.hypot(dx, dy) < m.slop) {
        return;
      }

      if (Math.abs(dy) > Math.abs(dx) * m.axisBias) {
        pointer = null;

        return;
      }

      p.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    p.velocity =
      m.previousWeight * p.velocity +
      (m.latestWeight * (event.clientX - p.lastX)) /
        Math.max(m.velocitySample, event.timeStamp - p.time);
    p.lastX = event.clientX;
    p.time = event.timeStamp;
    motion.drag(dx);
  };

  const up = (event: PointerEvent<HTMLDivElement>) => {
    const p = pointer;

    if (!p || p.id !== event.pointerId) {
      return;
    }

    pointer = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (p.horizontal) {
      motion.finish(
        event.timeStamp - p.time > m.velocityExpiry ? 0 : p.velocity,
        event.currentTarget.clientWidth,
      );
    }
  };

  const cancel = () => {
    if (pointer) {
      pointer = null;
      motion.settle();
    }
  };

  return {
    down,
    move,
    up,
    cancel,
    active: () => pointer !== null,
    lostCapture: (event: PointerEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        cancel();
      }
    },
  };
};
