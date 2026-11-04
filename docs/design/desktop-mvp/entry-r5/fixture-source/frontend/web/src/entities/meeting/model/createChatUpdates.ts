type Options = {
  refresh: () => Promise<void>;
  authenticate: () => Promise<void>;
  realtime: boolean;
  connect: (events: {
    ready: () => void;
    hint: () => void;
    unavailable: () => void;
    denied: () => void;
  }) => () => void;
  terminal: (error: unknown) => boolean;
  random?: () => number;
};

export const createChatUpdates = (options: Options) => {
  let stopped = false;
  let running = false;
  let dirty = false;
  let subscribed = false;
  let healthy = false;
  let attempt = 0;
  let generation = 0;
  let poll: ReturnType<typeof setTimeout> | undefined;
  let grace: ReturnType<typeof setTimeout> | undefined;
  let coalesce: ReturnType<typeof setTimeout> | undefined;
  let disconnect: (() => void) | undefined;
  const clearFallbackTimers = () => {
    clearTimeout(poll);
    clearTimeout(grace);
    poll = grace = undefined;
  };

  const stop = () => {
    stopped = true;
    generation += 1;
    clearFallbackTimers();
    clearTimeout(coalesce);
    coalesce = undefined;
    disconnect?.();
    disconnect = undefined;
  };

  const schedule = () => {
    if (stopped || healthy || poll !== undefined) {
      return;
    }

    const delay = attempt < 3 ? 3_000 * 2 ** attempt : 30_000;
    attempt = Math.min(attempt + 1, 3);
    poll = setTimeout(
      () => {
        poll = undefined;
        void refresh();
      },
      delay * (0.85 + (options.random ?? Math.random)() * 0.3),
    );
  };

  const refresh = async () => {
    if (stopped) {
      return;
    }

    if (running) {
      dirty = true;

      return;
    }

    running = true;
    const turn = generation;

    try {
      do {
        dirty = false;
        await options.refresh();
      } while (dirty && !stopped && generation === turn);

      if (!stopped && generation === turn) {
        healthy = subscribed;

        if (healthy || !options.realtime) {
          attempt = 0;
        }

        if (healthy) {
          clearFallbackTimers();
        }
      }
    } catch (error) {
      healthy = false;

      if (options.terminal(error)) {
        stop();
      }
    } finally {
      running = false;
      schedule();
    }
  };

  const unavailable = () => {
    subscribed = healthy = false;

    if (stopped || grace !== undefined || poll !== undefined) {
      return;
    }

    grace = setTimeout(() => {
      grace = undefined;
      schedule();
    }, 10_000);
  };

  const ready = () => {
    subscribed = true;
    void refresh();
  };

  const hint = () => {
    if (!stopped && coalesce === undefined) {
      coalesce = setTimeout(() => {
        coalesce = undefined;
        void refresh();
      }, 100);
    }
  };

  const start = async () => {
    const turn = generation;

    try {
      await options.authenticate();

      if (stopped || generation !== turn) {
        return;
      }

      if (options.realtime) {
        unavailable();
        disconnect = options.connect({ ready, hint, unavailable, denied: stop });
      } else {
        await refresh();
      }
    } catch (error) {
      if (options.terminal(error)) {
        stop();
      } else {
        schedule();
      }
    }
  };

  void start();

  return { stop, refresh, hint };
};
