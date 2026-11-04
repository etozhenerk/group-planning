import { ApiError, revision } from '@/shared/api';
import type {
  ReadMarkerOptions,
  ReadVisibility,
} from '@/entities/meeting/model/readMarkerTypes';

export const createReadMarker = (options: ReadMarkerOptions) => {
  const now = options.now ?? (() => performance.now());
  const visible = new Map<string, number>();
  let confirmed = BigInt(revision.parse(options.initialSequence ?? '0'));
  let desired = confirmed;
  let active = false;
  let covered = false;
  let disposed = false;
  let blocked = false;
  let lastAttempt = -Infinity;
  let retryAt = 0;
  let failures = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let flight:
    | { controller: AbortController; keepalive: boolean; promise: Promise<void> }
    | undefined;

  const clearTimer = () => {
    clearTimeout(timer);
    timer = undefined;
  };

  const sendMarker = (keepalive: boolean): Promise<void> => {
    if (flight) {
      return flight.promise;
    }

    const sequence = desired.toString();
    const controller = new AbortController();
    const current = { controller, keepalive, promise: Promise.resolve() };

    flight = current;
    lastAttempt = now();
    current.promise = Promise.resolve()
      .then(() => {
        if (controller.signal.aborted || (disposed && !keepalive)) {
          return null;
        }

        return options.send(sequence, controller.signal, keepalive);
      })
      .then((result) => {
        if (!result || disposed || controller.signal.aborted) {
          return;
        }

        failures = 0;
        retryAt = 0;
        const received = BigInt(result.read_through_sequence);

        if (received >= confirmed) {
          confirmed = received;
          desired = desired > confirmed ? desired : confirmed;
          options.onConfirmed(result);
        }
      })
      .catch((error: unknown) => {
        if (disposed || controller.signal.aborted) {
          return;
        }

        blocked =
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500 &&
          ![408, 429].includes(error.status);
        failures += 1;
        retryAt = now() + Math.min(30_000, 1_000 * 2 ** Math.min(failures - 1, 5));
        options.onError?.(error);
      })
      .finally(() => {
        if (flight === current) {
          flight = undefined;
        }

        drive();
      });

    return current.promise;
  };

  const drive = () => {
    clearTimer();

    if (disposed || blocked || !active || covered) {
      return;
    }

    const time = now();
    let next = Infinity;

    for (const [sequence, since] of visible) {
      if (time - since >= 500) {
        const value = BigInt(sequence);

        desired = value > desired ? value : desired;
        visible.delete(sequence);
      } else {
        next = Math.min(next, since + 500);
      }
    }

    if (!flight && desired > confirmed) {
      const sendAt = Math.max(lastAttempt + 1_000, retryAt);

      if (time >= sendAt) {
        void sendMarker(false);
      } else {
        next = Math.min(next, sendAt);
      }
    }

    if (Number.isFinite(next)) {
      timer = setTimeout(drive, Math.max(0, next - time));
    }
  };

  const setVisibility = (value: ReadVisibility) => {
    if (disposed || blocked) {
      return;
    }

    active = value.active;
    covered = value.covered;
    const sequences = new Set(
      active && !covered
        ? value.sequences.map((sequence) => revision.parse(sequence))
        : [],
    );

    for (const sequence of visible.keys()) {
      if (!sequences.has(sequence)) {
        visible.delete(sequence);
      }
    }

    for (const sequence of sequences) {
      if (!visible.has(sequence) && BigInt(sequence) > desired) {
        visible.set(sequence, now());
      }
    }

    drive();
  };

  const confirm = (sequence: string) => {
    if (disposed) {
      return;
    }

    const received = BigInt(revision.parse(sequence));

    confirmed = received > confirmed ? received : confirmed;
    desired = desired > confirmed ? desired : confirmed;
    drive();
  };

  const flush = () => {
    // Leaving may send only already-qualified reading, never an unexpired dwell.
    if (
      disposed ||
      blocked ||
      desired <= confirmed ||
      now() < Math.max(lastAttempt + 1_000, retryAt)
    ) {
      return Promise.resolve();
    }

    return sendMarker(true);
  };

  const dispose = () => {
    disposed = true;
    clearTimer();
    visible.clear();

    if (flight && !flight.keepalive) {
      flight.controller.abort();
    }
  };

  return {
    setVisibility,
    confirm,
    flush,
    dispose,
    getState: () => ({
      confirmed: confirmed.toString(),
      desired: desired.toString(),
      inFlight: !!flight,
      blocked,
    }),
  };
};
