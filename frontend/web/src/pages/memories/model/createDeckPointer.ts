import type { PointerEvent, KeyboardEvent } from 'react';
import type { DeckMotion } from '@/pages/memories/model/createDeckMotion';
import { photoMotionMetrics as m } from '@/shared/lib/photo-motion';

export const createDeckPointer = (motion: DeckMotion, count: () => number) => {
  let pointer: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    time: number;
    velocity: number;
    horizontal: boolean;
    width: number;
  } | null = null;

  const down = (event: PointerEvent<HTMLDivElement>) => {
    if (pointer && pointer.id !== event.pointerId) {
      pointer = null;
      motion.blockTap();
      motion.settle();

      return;
    }

    if (
      event.button !== 0 ||
      motion.read().phase !== 'idle' ||
      !count() ||
      (event.target instanceof Element && !event.target.closest('[data-front="true"]'))
    ) {
      return;
    }

    motion.begin();
    pointer = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      time: event.timeStamp,
      velocity: 0,
      horizontal: false,
      width:
        event.currentTarget.querySelector('[data-front="true"]')?.getBoundingClientRect()
          .width ?? event.currentTarget.clientWidth,
    };
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const origin = pointer;

    if (!origin || origin.id !== event.pointerId) {
      return;
    }

    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;

    if (!origin.horizontal) {
      if (Math.hypot(dx, dy) < m.slop) {
        return;
      }

      motion.blockTap();

      if (Math.abs(dy) > Math.abs(dx) * m.axisBias) {
        pointer = null;

        return;
      }

      origin.horizontal = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    origin.velocity =
      m.previousWeight * origin.velocity +
      (m.latestWeight * (event.clientX - origin.lastX)) /
        Math.max(m.velocitySample, event.timeStamp - origin.time);
    origin.lastX = event.clientX;
    origin.time = event.timeStamp;
    motion.drag(
      dx,
      Math.max(-m.verticalMaximum, Math.min(m.verticalMaximum, dy * m.verticalRatio)),
    );
  };

  const up = (event: PointerEvent<HTMLDivElement>) => {
    const origin = pointer;

    if (!origin || origin.id !== event.pointerId) {
      return;
    }

    pointer = null;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (origin.horizontal) {
      motion.finish(
        motion.read().offset,
        event.timeStamp - origin.time > m.velocityExpiry ? 0 : origin.velocity,
        origin.width,
      );
    }
  };

  const cancel = () => {
    if (pointer) {
      pointer = null;
      motion.blockTap();
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
    keyboard: (event: KeyboardEvent<HTMLDivElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        motion.advance(
          event.key === 'ArrowRight' ? 1 : -1,
          event.currentTarget.clientWidth,
        );
      }
    },
  };
};
