import { useEffect, useMemo, useRef, useState } from 'react';
import {
  createDeckMotion,
  initialDeckState,
} from '@/pages/memories/model/createDeckMotion';
import { createDeckPointer } from '@/pages/memories/model/createDeckPointer';
import { useDeckWheel } from '@/pages/memories/model/useDeckWheel';
import { photoMotionMetrics as vibeMetrics } from '@/shared/lib/photo-motion';

export const useMobileAlbum = (count: number) => {
  const currentCount = useRef(count);
  currentCount.current = count;
  const [state, setState] = useState(initialDeckState);
  const [motion] = useState(() => createDeckMotion(() => currentCount.current, setState));
  const pointer = useMemo(
    () => createDeckPointer(motion, () => currentCount.current),
    [motion],
  );

  const element = useRef<HTMLDivElement>(null);
  useDeckWheel(element, motion, pointer.active, count, state.grid);
  useEffect(() => {
    motion.countChanged();
  }, [count, motion]);
  useEffect(() => {
    motion.activate();

    return () => motion.dispose();
  }, [motion]);

  return {
    ...state,
    element,
    select: motion.select,
    setGrid: motion.setGrid,
    progress: Math.min(
      1,
      Math.abs(state.offset) / Math.max(1, window.innerWidth * vibeMetrics.progressRatio),
    ),
    moving: ['exiting', 'assembling', 'handoff'].includes(state.phase),
    resetting: state.phase === 'assembling',
    start: pointer.down,
    move: pointer.move,
    end: pointer.up,
    cancel: pointer.cancel,
    lostCapture: pointer.lostCapture,
    keyboard: pointer.keyboard,
    canOpen: motion.canOpen,
  };
};
