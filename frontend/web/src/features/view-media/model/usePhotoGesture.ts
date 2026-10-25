import { useRef } from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';

export const usePhotoGesture = (change: (step: -1 | 1) => void) => {
  const start = useRef<{ x: number; y: number } | null>(null);
  const down = (event: PointerEvent<HTMLDivElement>) => {
    start.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const up = (event: PointerEvent<HTMLDivElement>) => {
    if (start.current) {
      const dx = event.clientX - start.current.x;
      const dy = event.clientY - start.current.y;

      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
        change(dx < 0 ? 1 : -1);
      }
    }

    start.current = null;
  };

  const cancel = () => {
    start.current = null;
  };

  const key = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      change(event.key === 'ArrowRight' ? 1 : -1);
    }
  };

  return { down, up, cancel, key };
};
