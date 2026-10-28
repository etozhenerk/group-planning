import { useEffect, useRef, useState } from 'react';
import type { PointerEvent, KeyboardEvent } from 'react';
import { designTokens } from '@/shared/config/design-tokens';

export const useAlbum = (count: number) => {
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);
  const [grid, setGrid] = useState(false);
  const [moving, setMoving] = useState(false);
  const [resetting, setResetting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (timer.current) {
        clearTimeout(timer.current);
      }
    },
    [],
  );
  const moved = useRef(false);
  const pointer = useRef<{ id: number; x: number; y: number } | null>(null);
  const select = (value: number) =>
    setIndex(count ? ((value % count) + count) % count : 0);

  const advance = (step: number, width: number, fromSwipe = false) => {
    if (count < 2 || timer.current) {
      return;
    }

    const next = index + (fromSwipe ? 1 : step);
    const reset = fromSwipe && next === count;
    const duration = Number.parseFloat(designTokens.motionDurationPhoto);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      select(next);
      setOffset(0);

      return;
    }

    setMoving(true);
    setOffset(-step * width);
    timer.current = setTimeout(() => {
      select(next);
      setOffset(0);
      setResetting(reset);

      if (reset) {
        timer.current = setTimeout(() => {
          setResetting(false);
          setMoving(false);
          timer.current = null;
        }, duration);
      } else {
        setMoving(false);
        timer.current = null;
      }
    }, duration);
  };

  const start = (event: PointerEvent<HTMLDivElement>) => {
    moved.current = false;

    if (event.button !== 0 || timer.current !== null) {
      return;
    }

    pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const origin = pointer.current;

    if (!origin || origin.id !== event.pointerId) {
      return;
    }

    const dx = event.clientX - origin.x;
    const dy = event.clientY - origin.y;

    if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 12) {
      moved.current = true;
      pointer.current = null;
      setOffset(0);

      return;
    }

    if (Math.abs(dx) > 5) {
      moved.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    setOffset(dx);
  };

  const cancel = () => {
    if (timer.current) {
      return;
    }

    pointer.current = null;
    setOffset(0);
  };

  const end = (event: PointerEvent<HTMLDivElement>) => {
    const origin = pointer.current;

    if (!origin) {
      return;
    }

    const dx = event.clientX - origin.x;

    if (Math.abs(dx) > 60) {
      pointer.current = null;
      advance(dx < 0 ? 1 : -1, event.currentTarget.clientWidth, true);
    }

    cancel();
  };

  const keyboard = (event: KeyboardEvent<HTMLDivElement>) => {
    if (
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    ) {
      return;
    }

    if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      advance(event.key === 'ArrowRight' ? 1 : -1, event.currentTarget.clientWidth);
    }
  };

  useEffect(() => {
    if (index >= count && count > 0) {
      setIndex(count - 1);
    }
  }, [count, index]);

  return {
    index,
    select,
    offset,
    grid,
    moving,
    resetting,
    setGrid,
    start,
    move,
    end,
    cancel,
    keyboard,
    canOpen: () => !moved.current && !moving,
  };
};
