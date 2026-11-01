import { ApiError } from '@/shared/api';
import { observePrivateStore } from '@/shared/lib/private-store';
import {
  cancelAlbumExport,
  getAlbumExport,
  prepareAlbumExport,
} from '@/features/download-album/api/albumExport';
import { startAlbumNavigation } from '@/features/download-album/lib/startAlbumNavigation';
import { waitForExportPoll } from '@/features/download-album/lib/waitForExportPoll';
import type { AlbumOperation } from '@/features/download-album/model/albumOperation';
import { createAlbumCleanup } from '@/features/download-album/model/createAlbumCleanup';
import type {
  AlbumDownloadScope,
  AlbumDownloadState,
  AlbumExportAPI,
} from '@/features/download-album/model/types';

type Options = {
  api?: AlbumExportAPI;
  navigate?: (meeting: string, id: string) => void;
  denied: (cause: ApiError) => void;
};

export const createAlbumDownload = (scope: AlbumDownloadScope, options: Options) => {
  const api = options.api ?? {
    prepare: prepareAlbumExport,
    status: getAlbumExport,
    cancel: cancelAlbumExport,
  };

  const navigate = options.navigate ?? startAlbumNavigation;
  const listeners = new Set<() => void>();
  let state: AlbumDownloadState = { phase: 'idle' };
  let operation: AlbumOperation | undefined;
  let pending: Promise<void> | undefined;
  let stopped = false;
  const current = () => !stopped && !scope.signal.aborted && scope.current();
  const owns = (value: AlbumOperation) =>
    current() && operation === value && !value.controller.signal.aborted;

  const cleanup = createAlbumCleanup(scope, api, current);

  const publish = (value: AlbumDownloadState) => {
    state = value;
    listeners.forEach((listener) => listener());
  };

  const cancel = () => {
    const previous = operation;
    operation = undefined;
    pending = undefined;
    previous?.controller.abort();
    publish({ phase: 'idle' });
    cleanup.cancel(previous);
  };

  const dispose = () => {
    if (stopped) {
      return;
    }

    stopped = true;
    cancel();
    unobserve();
    scope.signal.removeEventListener('abort', dispose);
    listeners.clear();
  };

  const unobserve = observePrivateStore((event) => {
    if (
      event.kind === 'purged' &&
      (!event.user || event.user === scope.user) &&
      (!event.meeting || event.meeting === scope.meeting)
    ) {
      dispose();
    }
  });

  scope.signal.addEventListener('abort', dispose, { once: true });

  const fail = (value: AlbumOperation, cause: unknown) => {
    if (owns(value)) {
      publish({ phase: 'error', cause });

      if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
        options.denied(cause);
        dispose();
      }
    }
  };

  const run = async (value: AlbumOperation) => {
    try {
      const signal = value.controller.signal;
      const requestSignal = () => AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
      // Keep the bounded POST acknowledgement for compensating DELETE, even
      // after UI cancellation. Polls and browser hand-off still use owns().
      value.preparation = api.prepare(
        scope.meeting,
        scope.csrf,
        value.key,
        AbortSignal.timeout(15_000),
      );
      let result = await value.preparation;

      value.id = result.id;
      const count = result.count;

      while (owns(value)) {
        if (result.id !== value.id || result.count !== count) {
          throw new ApiError(502, 'invalid_response');
        }

        if (Date.parse(result.expires_at) <= Date.now()) {
          throw new ApiError(404, 'album_export_expired');
        }

        if (result.state === 'failed') {
          throw new ApiError(500, 'album_export_failed');
        }

        if (result.state === 'ready') {
          navigate(scope.meeting, value.id);
          value.handedOff = true;

          if (owns(value)) {
            publish({ phase: 'started', count: result.count });
          }

          return;
        }

        publish({ phase: 'preparing', count: result.count });
        await waitForExportPoll(signal);

        if (!owns(value)) {
          break;
        }

        result = await api.status(scope.meeting, value.id, requestSignal());
      }

      if (!current()) {
        dispose();
      }

      cleanup.discard(value);
    } catch (cause) {
      fail(value, cause);
      cleanup.discard(value);
    } finally {
      if (operation === value) {
        pending = undefined;
      }
    }
  };

  const start = (): Promise<void> => {
    if (!current()) {
      dispose();

      return Promise.resolve();
    }

    if (pending) {
      return pending;
    }

    const previous = operation;
    const value: AlbumOperation = {
      // Retry a lost POST with the same key; the server might already own its job.
      key:
        state.phase === 'error' && previous && !previous.id
          ? previous.key
          : crypto.randomUUID(),
      controller: new AbortController(),
    };

    previous?.controller.abort();
    operation = value;
    const task = Promise.resolve().then(async () => {
      try {
        await cleanup.beforeStart(previous);

        if (owns(value)) {
          await run(value);
        }
      } catch (cause) {
        fail(value, cause);
      } finally {
        if (operation === value) {
          pending = undefined;
        }
      }
    });

    pending = task;
    publish({ phase: 'preparing', count: null });

    return task;
  };

  if (!current()) {
    dispose();
  }

  return {
    start,
    cancel,
    dispose,
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      if (!stopped) {
        listeners.add(listener);
      }

      return () => listeners.delete(listener);
    },
  };
};
