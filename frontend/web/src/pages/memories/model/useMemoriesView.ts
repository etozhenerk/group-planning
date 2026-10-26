import { useFilePicker } from '@/shared/lib/file-picker';
import { useAlbumPaging } from '@/pages/memories/model/useAlbumPaging';
import { useSearchParams } from 'react-router';
import { useMemories, useMeeting } from '@/entities/meeting';
import { useMobileLayout } from '@/shared/lib/media';
import { useUploadSelection } from '@/features/upload-media';
import { useAlbum } from '@/pages/memories/model/useAlbum';

export const useMemoriesView = (id: string, user: string) => {
  const mobile = useMobileLayout();
  const query = useMemories(id, user);
  const meeting = useMeeting(id, user);
  const photos = query.data?.pages.flatMap((page) => page.photos) ?? [];
  const album = useAlbum(photos.length);
  useAlbumPaging(query, album.index, photos.length);
  const [params, setParams] = useSearchParams();
  const uploading = params.get('action') === 'upload';
  const fromChat = params.get('from') === 'chat';
  const origin = fromChat ? { from: 'chat' } : {};
  const upload = useUploadSelection(user, id);
  const picker = useFilePicker((files) =>
    upload.begin({
      files,
      photo: true,
      purpose: 'memory',
    }),
  );

  const current = photos.find((photo) => photo.id === params.get('photo'));
  const close = () => setParams(origin, { replace: true, preventScrollReset: true });

  return {
    mobile,
    query,
    meeting,
    photos,
    album,
    uploading,
    fromChat,
    picker,
    current,
    close,
    choose: () => {
      setParams({ ...origin, action: 'upload' }, { preventScrollReset: true });

      if (!upload.selection || upload.selection.purpose !== 'memory') {
        picker.choose(true);
      }
    },
    open: (index: number) => {
      const photo = photos[index];

      if (photo) {
        setParams({ ...origin, photo: photo.id }, { preventScrollReset: true });
      }
    },
    change: (step: number) => {
      const index =
        (photos.findIndex((photo) => photo.id === current?.id) + step + photos.length) %
        photos.length;

      const photo = photos[index];

      if (photo) {
        album.select(index);
        setParams(
          { ...origin, photo: photo.id },
          { replace: true, preventScrollReset: true },
        );
      }
    },
  };
};
