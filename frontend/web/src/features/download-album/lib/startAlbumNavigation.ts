import { albumExportPath } from '@/features/download-album/api/albumExport';

export const startAlbumNavigation = (meeting: string, id: string) => {
  const link = document.createElement('a');
  link.href = `/api/v1${albumExportPath(meeting, id)}/download`;
  link.download = 'somewhere-photos.zip';
  link.hidden = true;
  document.body.append(link);

  try {
    link.click();
  } finally {
    link.remove();
  }
};
