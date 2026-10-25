import { useFilePicker } from '@/shared/lib/file-picker';
import { useAlbumPaging } from '@/pages/memories/model/useAlbumPaging';
import { Link, useSearchParams } from 'react-router';
import { AlbumHeading } from '@/pages/memories/ui/AlbumHeading';
import { useMemories, useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useUploadSelection } from '@/features/upload-media';
import { Navigation } from '@/widgets/navigation';
import { Workspace } from '@/shared/ui/Workspace';
import { useAlbum } from '@/pages/memories/model/useAlbum';
import { AlbumBody } from '@/pages/memories/ui/AlbumBody';
import { PhotoViewer } from '@/features/view-media';
import styles from '@/pages/memories/ui/MemoriesView/MemoriesView.module.css';

export type MemoriesViewProps = { id: string; session: Session };

export const MemoriesView = ({ id, session }: MemoriesViewProps) => {
  const query = useMemories(id, session.user.id);
  const meeting = useMeeting(id, session.user.id);
  const photos = query.data?.pages.flatMap((page) => page.photos) ?? [];
  const album = useAlbum(photos.length);
  useAlbumPaging(query, album.index, photos.length);
  const [params, setParams] = useSearchParams();
  const fromChat = params.get('from') === 'chat';
  const origin = fromChat ? { from: 'chat' } : {};
  const upload = useUploadSelection(session.user.id, id);
  const picker = useFilePicker((files) =>
    upload.begin({
      files,
      photo: true,
      purpose: 'memory',
      returnTo: `/meetings/${id}/memories${fromChat ? '?from=chat' : ''}`,
    }),
  );

  const current = photos.find((photo) => photo.id === params.get('photo'));

  return (
    <Workspace navigation={<Navigation session={session} />}>
      <main id="main" className={styles.page}>
        <input {...picker.inputProps} />
        <Link
          className={styles.back}
          to={fromChat ? `/meetings/${id}` : '/meetings?view=list&period=past'}
        >
          {fromChat ? '← К встрече' : '‹ Прошедшие встречи'}
        </Link>
        <AlbumHeading
          meeting={meeting.data}
          upload={() => picker.choose(true)}
          disabled={query.access.denied}
        />
        <AlbumBody
          photos={photos}
          user={session.user.id}
          album={album}
          query={query}
          open={(index) => {
            const photo = photos[index];

            if (photo) {
              setParams({ ...origin, photo: photo.id });
            }
          }}
        />
        {current && !query.access.denied && (
          <PhotoViewer
            media={current}
            index={photos.findIndex((photo) => photo.id === current.id)}
            count={photos.length}
            change={(step) => {
              const index =
                (photos.findIndex((photo) => photo.id === current.id) +
                  step +
                  photos.length) %
                photos.length;

              const photo = photos[index];

              if (photo) {
                album.select(index);
                setParams({ ...origin, photo: photo.id }, { replace: true });
              }
            }}
            user={session.user.id}
            close={() => setParams(origin, { replace: true })}
          />
        )}
      </main>
    </Workspace>
  );
};
