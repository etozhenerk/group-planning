import { useAlbumPaging } from '@/pages/memories/model/useAlbumPaging';
import { useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { readReturnLocation } from '@/shared/lib/navigation';
import { useMemories, useMeeting, usePreloadMedia } from '@/entities/meeting';
import { useAlbum } from '@/pages/memories/model/useAlbum';

export const useMemoriesView = (id: string, user: string) => {
  const navigate = useNavigate();
  const location = useLocation();
  const state: unknown = location.state;
  const navigation = { preventScrollReset: true, state };
  const query = useMemories(id, user);
  const meeting = useMeeting(id, user);
  const photos = useMemo(
    () => query.data?.pages.flatMap((page) => page.photos) ?? [],
    [query.data],
  );

  usePreloadMedia(id, user, photos);
  const album = useAlbum(photos.length);
  useAlbumPaging(query, album.index, photos.length);
  const [params, setParams] = useSearchParams();
  const uploading = params.get('action') === 'upload';
  const fromChat = params.get('from') === 'chat';
  const origin = fromChat ? { from: 'chat' } : {};
  const current = photos.find((photo) => photo.id === params.get('photo'));
  const close = () => {
    if (uploading && params.get('uploadOrigin') === 'chat') {
      void navigate(`/meetings/${id}`, { replace: true, preventScrollReset: true });
    } else {
      setParams(origin, { ...navigation, replace: true });
    }
  };

  return {
    query,
    meeting,
    photos,
    album,
    uploading,
    fromChat,
    returnPath: readReturnLocation(location.state, '/meetings?view=list&period=past')
      .path,
    current,
    close,
    complete: () => setParams(origin, { ...navigation, replace: true }),
    choose: () => {
      setParams({ ...origin, action: 'upload' }, navigation);
    },
    open: (index: number) => {
      const photo = photos[index];

      if (photo) {
        setParams({ ...origin, photo: photo.id }, navigation);
      }
    },
    change: (step: number) => {
      const index =
        (photos.findIndex((photo) => photo.id === current?.id) + step + photos.length) %
        photos.length;

      const photo = photos[index];

      if (photo) {
        album.select(index);
        setParams({ ...origin, photo: photo.id }, { ...navigation, replace: true });
      }
    },
  };
};
