import type { AlbumExport } from '@/features/download-album/api/albumExportSchema';

export type AlbumOperation = {
  key: string;
  controller: AbortController;
  id?: string;
  handedOff?: boolean;
  cleaned?: boolean;
  preparation?: Promise<AlbumExport>;
  recovery?: Promise<AlbumExport>;
  cleanup?: Promise<void>;
};
