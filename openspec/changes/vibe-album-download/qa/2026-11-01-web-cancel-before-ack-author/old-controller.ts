import { ApiError } from '@/shared/api';
import { observePrivateStore } from '@/shared/lib/private-store';
import {
  cancelAlbumExport,
  getAlbumExport,
  prepareAlbumExport,
} from '@/features/download-album/api/albumExport';
import { startAlbumNavigation } from '@/features/download-album/lib/startAlbumNavigation';
import { waitForExportPoll } from '@/features/download-album/lib/waitForExportPoll';
import type {
  AlbumDownloadScope,
  AlbumDownloadState,
  AlbumExportAPI,
} from '@/features/download-album/model/types';

type Operation = {
  key: string;
  controller: AbortController;
  id?: string;
  handedOff?: boolean;
  cleanup?: Promise<void>;
};

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
  let operation: Operation | undefined;
  let pending: Promise<void> | undefined;
  let stopped = false;
  const current = () => !stopped && !scope.signal.aborted && scope.current();
  const owns = (value: Operation) =>
    current() && operation === value && !value.controller.signal.aborted;

  const publish = (value: AlbumDownloadState) => {
    state = value;
    listeners.forEach((listener) => listener());
  };

  const cleanup = async (value?: Operation) => {
    if (!value?.id || value.handedOff) {
      return;
    }

    // This request has its own timeout and never restores local state.
    value.cleanup ??= api
      .cancel(scope.meeting, value.id, scope.csrf)
      .catch(() => undefined);
    await value.cleanup;
  };

  const cancel = () => {
    const previous = operation;
    operation = undefined;
    pending = undefined;
    previous?.controller.abort();
    publish({ phase: 'idle' });
    void cleanup(previous);
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

  const run = async (value: Operation) => {
    try {
      const signal = value.controller.signal;
      const requestSignal = () => AbortSignal.any([signal, AbortSignal.timeout(15_000)]);
      let result = await api.prepare(
        scope.meeting,
        scope.csrf,
        value.key,
        requestSignal(),
      );

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

      void cleanup(value);
    } catch (cause) {
      if (owns(value)) {
        publish({ phase: 'error', cause });

        if (cause instanceof ApiError && [401, 403].includes(cause.status)) {
          options.denied(cause);
          dispose();
        }
      }

      void cleanup(value);
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
    const value: Operation = {
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
      await cleanup(previous);

      if (owns(value)) {
        await run(value);
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
