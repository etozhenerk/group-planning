import { Grid2X2, Layers } from 'lucide-react';
import type { Media } from '@/shared/api';
import type { useMemories } from '@/entities/meeting';
import type { useAlbum } from '@/pages/memories/model/useAlbum';
import { AlbumPhotos } from '@/pages/memories/ui/AlbumPhotos';
import { Status } from '@/shared/ui/Status';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import styles from '@/pages/memories/ui/AlbumBody/AlbumBody.module.css';

export type AlbumBodyProps = {
  photos: Media[];
  user: string;
  album: ReturnType<typeof useAlbum>;
  query: ReturnType<typeof useMemories>;
  open: (index: number) => void;
};

export const AlbumBody = ({ photos, user, album, query, open }: AlbumBodyProps) => {
  if (query.access.denied) {
    return <Status title="Доступ к фото закрыт" />;
  }

  if (query.isPending) {
    return <SkeletonRows label="Загрузка фото" />;
  }

  if (query.error && !photos.length) {
    return (
      <Status title="Не удалось открыть фото" error action={() => void query.refetch()} />
    );
  }

  return (
    <>
      {photos.length > 0 ? (
        <>
          <AlbumPhotos photos={photos} user={user} album={album} open={open} />
          <div className={styles.counter}>
            <span aria-live="polite">
              {album.index + 1} / {photos.length}
              {query.hasNextPage ? ' +' : ''}
            </span>
            <button
              type="button"
              onClick={() => album.setGrid(!album.grid)}
              aria-label={album.grid ? 'Показать стопкой' : 'Показать сеткой'}
            >
              {album.grid ? <Layers size={18} /> : <Grid2X2 size={18} />}
            </button>
          </div>
        </>
      ) : (
        <Status
          title="Как всё прошло?"
          text="Добавьте фото встречи — они будут доступны участникам."
        />
      )}
      {query.hasNextPage && (
        <button
          type="button"
          disabled={query.isFetchingNextPage}
          onClick={() => void query.fetchNextPage()}
        >
          {query.isFetchingNextPage ? 'Загрузка…' : 'Ещё фото'}
        </button>
      )}
      {query.error && photos.length > 0 && (
        <Status
          title="Не удалось загрузить остальные фото"
          error
          action={() => void query.fetchNextPage()}
        />
      )}
    </>
  );
};
