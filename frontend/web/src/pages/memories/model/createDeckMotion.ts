import { photoMotionMetrics as m } from '@/shared/lib/photo-motion';
import type { DeckState, DeckEnvironment } from '@/pages/memories/model/deckTypes';

export const initialDeckState = (): DeckState => ({
  index: 0,
  offset: 0,
  vertical: 0,
  phase: 'idle',
  recycledIndex: null,
  duration: m.returning,
  grid: false,
});

export const createDeckMotion = (
  count: () => number,
  changed: (state: DeckState) => void,
  env: DeckEnvironment = {
    reduced: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    viewport: () => window.innerWidth,
    frame: (callback) => requestAnimationFrame(callback),
    cancelFrame: (id) => cancelAnimationFrame(id),
  },
) => {
  let state = initialDeckState();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frame: number | undefined;
  let pending: number | null = null;
  let blockedTap = false;
  let stopped = false;
  const patch = (value: Partial<DeckState>) => {
    if (!stopped) {
      state = { ...state, ...value };
      changed(state);
    }
  };

  const clear = () => {
    clearTimeout(timer);

    if (frame !== undefined) {
      env.cancelFrame(frame);
    }

    timer = undefined;
    frame = undefined;
  };

  const select = (next: number) => {
    clear();
    pending = null;
    patch({
      index: count() ? ((next % count()) + count()) % count() : 0,
      offset: 0,
      vertical: 0,
      recycledIndex: null,
      phase: 'idle',
    });
  };

  const settle = () => {
    clear();
    patch({
      offset: 0,
      vertical: 0,
      duration: m.returning,
      phase: env.reduced() ? 'idle' : 'returning',
    });

    if (!env.reduced()) {
      timer = setTimeout(() => patch({ phase: 'idle' }), m.returning);
    }
  };

  const exit = (
    direction: number,
    next: number,
    velocity: number,
    cycle: boolean,
    width: number,
  ) => {
    clear();
    pending = next;
    blockedTap = true;

    if (env.reduced()) {
      select(next);

      return;
    }

    const old = state.index;
    const target = direction * (env.viewport() + width);
    const duration = Math.round(
      Math.min(
        m.maximumFlight,
        Math.max(
          m.minimumFlight,
          Math.abs(target - state.offset) / (Math.abs(velocity) + m.flightBias),
        ),
      ),
    );

    patch({ duration, phase: 'exiting' });
    frame = env.frame(() => {
      frame = env.frame(() => {
        patch({ offset: target, vertical: 0 });
        timer = setTimeout(() => {
          pending = null;
          patch({
            index: next,
            offset: 0,
            vertical: 0,
            phase: cycle ? 'assembling' : 'handoff',
            recycledIndex: cycle ? null : old,
          });

          if (cycle) {
            timer = setTimeout(() => patch({ phase: 'idle' }), m.assembly);
          } else {
            frame = env.frame(() => {
              frame = env.frame(() => patch({ recycledIndex: null, phase: 'idle' }));
            });
          }
        }, duration);
      });
    });
  };

  const finish = (distance: number, velocity: number, width: number) => {
    const threshold = Math.min(
      m.maximumDistance,
      Math.max(m.minimumDistance, width * m.distanceRatio),
    );

    if (
      count() > 1 &&
      (Math.abs(distance) >= threshold ||
        (Math.abs(distance) > m.flickDistance && Math.abs(velocity) > m.flickVelocity))
    ) {
      exit(
        Math.sign(distance || velocity),
        (state.index + 1) % count(),
        velocity,
        state.index === count() - 1,
        width,
      );
    } else {
      settle();
    }
  };

  return {
    read: () => state,
    select,
    settle,
    finish,
    exit,
    begin: () => {
      blockedTap = false;
    },
    blockTap: () => {
      blockedTap = true;
    },
    canOpen: () => !blockedTap && state.phase === 'idle',
    drag: (offset: number, vertical = 0) =>
      patch({ offset, vertical, phase: 'dragging' }),
    advance: (step: -1 | 1, width: number) => {
      if (count() > 1 && state.phase === 'idle') {
        exit(-step, (state.index + step + count()) % count(), 1, false, width);
      }
    },
    setGrid: (grid: boolean) => {
      select(pending ?? state.index);
      patch({ grid });
    },
    countChanged: () => {
      if (!count() || state.index >= count()) {
        select(Math.max(0, count() - 1));
      }
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

export type DeckMotion = ReturnType<typeof createDeckMotion>;
