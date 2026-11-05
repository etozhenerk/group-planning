import { photoMotionMetrics as m } from '@/shared/lib/photo-motion';

export type ViewerState = {
  offset: number;
  phase: 'idle' | 'dragging' | 'returning' | 'exiting' | 'committing';
};

export const createViewerMotion = (
  count: () => number,
  commit: (step: -1 | 1) => void,
  changed: (state: ViewerState) => void,
) => {
  let state: ViewerState = { offset: 0, phase: 'idle' };
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame: number | undefined;
  let stopped = false;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const patch = (value: Partial<ViewerState>) => {
    if (!stopped) {
      state = { ...state, ...value };
      changed(state);
    }
  };

  const clear = () => {
    clearTimeout(timer);

    if (frame !== undefined) {
      cancelAnimationFrame(frame);
    }
  };

  const settle = () => {
    clear();
    patch({ offset: 0, phase: reduced() ? 'idle' : 'returning' });

    if (!reduced()) {
      timer = setTimeout(() => patch({ phase: 'idle' }), m.returning);
    }
  };

  const slide = (step: -1 | 1, width: number) => {
    if (count() < 2) {
      settle();

      return;
    }

    if (reduced()) {
      patch({ phase: 'committing' });
      commit(step);

      return;
    }

    patch({ phase: 'exiting' });
    frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        patch({ offset: -step * width });
        timer = setTimeout(() => {
          patch({ phase: 'committing' });
          commit(step);
        }, m.viewer);
      });
    });
  };

  return {
    read: () => state,
    settle,
    slide,
    drag: (offset: number) => patch({ offset, phase: 'dragging' }),
    finish: (velocity: number, width: number) => {
      const dx = state.offset;

      if (
        count() > 1 &&
        (Math.abs(dx) > Math.max(m.minimumDistance, width * m.viewerRatio) ||
          (Math.abs(dx) > m.viewerFlickDistance && Math.abs(velocity) > m.flickVelocity))
      ) {
        slide(dx < 0 ? 1 : -1, width);
      } else {
        settle();
      }
    },
    committed: () => {
      clear();
      patch({ offset: 0, phase: 'idle' });
    },
    activate: () => {
      stopped = false;
    },
    dispose: () => {
      clear();
      stopped = true;
    },
  };
};

export type ViewerMotion = ReturnType<typeof createViewerMotion>;
