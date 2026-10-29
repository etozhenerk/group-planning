import type { AlbumExport } from '@/features/download-album/api/albumExportSchema';

export type AlbumDownloadState =
  | { phase: 'idle' }
  | { phase: 'preparing'; count: number | null }
  | { phase: 'started'; count: number }
  | { phase: 'error'; cause: unknown };

export type AlbumDownloadScope = {
  user: string;
  meeting: string;
  csrf: string | null;
  // The screen owner aborts this lease on unmount or a session/access change.
  signal: AbortSignal;
  current: () => boolean;
};

export type AlbumExportAPI = {
  prepare: (
    meeting: string,
    csrf: string | null,
    key: string,
    signal: AbortSignal,
  ) => Promise<AlbumExport>;
  status: (meeting: string, id: string, signal: AbortSignal) => Promise<AlbumExport>;
  cancel: (meeting: string, id: string, csrf: string | null) => Promise<void>;
};
