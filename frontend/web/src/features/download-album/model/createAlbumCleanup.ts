import type { AlbumOperation } from '@/features/download-album/model/albumOperation';
import type {
  AlbumDownloadScope,
  AlbumExportAPI,
} from '@/features/download-album/model/types';

export const createAlbumCleanup = (
  scope: AlbumDownloadScope,
  api: AlbumExportAPI,
  current: () => boolean,
) => {
  let pending: AlbumOperation | undefined;

  const settle = async (value?: AlbumOperation, recover = false): Promise<void> => {
    if (!value || value.handedOff || value.cleaned) {
      return;
    }

    if (!value.id && value.preparation) {
      try {
        value.id = (await value.preparation).id;
      } catch {
        if (!recover || !current()) {
          return;
        }

        // Recover only this canceled intent, before creating a fresh snapshot.
        value.recovery ??= api.prepare(
          scope.meeting,
          scope.csrf,
          value.key,
          AbortSignal.timeout(15_000),
        );

        try {
          value.id = (await value.recovery).id;
        } catch (cause) {
          delete value.recovery;
          throw cause;
        }
      }
    }

    if (!value.id) {
      return;
    }

    value.cleanup ??= api.cancel(scope.meeting, value.id, scope.csrf);

    try {
      await value.cleanup;
    } catch (cause) {
      delete value.cleanup;
      throw cause;
    }

    value.cleaned = true;

    if (pending === value) {
      pending = undefined;
    }
  };

  const discard = (value?: AlbumOperation, canceled = false) => {
    if (value && !value.handedOff && !value.cleaned && (value.id || canceled)) {
      pending = value;
    }

    void settle(value).catch(() => undefined);
  };

  return {
    discard,
    cancel: (value?: AlbumOperation) => discard(value, Boolean(value?.preparation)),
    beforeStart: async (previous?: AlbumOperation) => {
      const canceled = pending;
      await settle(canceled, true);

      if (previous !== canceled) {
        await settle(previous);
      }
    },
  };
};
