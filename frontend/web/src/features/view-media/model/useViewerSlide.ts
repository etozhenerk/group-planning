import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { createViewerMotion } from '@/features/view-media/model/createViewerMotion';
import type { ViewerState } from '@/features/view-media/model/createViewerMotion';
import { createViewerPointer } from '@/features/view-media/model/createViewerPointer';
import { useViewerWheel } from '@/features/view-media/model/useViewerWheel';

export const useViewerSlide = (
  count: number,
  change: (step: -1 | 1) => void,
  mediaId: string,
  active: boolean,
) => {
  const current = useRef({ count, change });
  current.current = { count, change };
  const [state, setState] = useState<ViewerState>({ offset: 0, phase: 'idle' });
  const [motion] = useState(() =>
    createViewerMotion(
      () => current.current.count,
      (step) => current.current.change(step),
      setState,
    ),
  );

  const pointer = useMemo(() => createViewerPointer(motion), [motion]);
  const element = useRef<HTMLDivElement>(null);
  useViewerWheel(element, motion, pointer.active, count, active);
  useEffect(() => {
    motion.activate();

    return () => motion.dispose();
  }, [motion]);
  useLayoutEffect(() => {
    motion.committed();
  }, [mediaId, motion]);

  return {
    ...state,
    ...pointer,
    element,
    key: (event: KeyboardEvent<HTMLDialogElement>) => {
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (
        (event.key === 'ArrowLeft' || event.key === 'ArrowRight') &&
        motion.read().phase === 'idle'
      ) {
        event.preventDefault();
        motion.slide(
          event.key === 'ArrowRight' ? 1 : -1,
          element.current?.clientWidth ?? window.innerWidth,
        );
      }
    },
  };
};
