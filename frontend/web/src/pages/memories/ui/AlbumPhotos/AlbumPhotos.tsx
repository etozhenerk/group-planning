import type { CSSProperties } from 'react';
import type { Media } from '@/shared/api';
import { MediaPhoto, LazyMediaPhoto } from '@/entities/meeting';
import type { useAlbum } from '@/pages/memories/model/useAlbum';
import styles from '@/pages/memories/ui/AlbumPhotos/AlbumPhotos.module.css';

export type AlbumPhotosProps = {
  photos: Media[];
  user: string;
  album: ReturnType<typeof useAlbum>;
  open: (index: number) => void;
};

export const AlbumPhotos = ({ photos, user, album, open }: AlbumPhotosProps) => {
  if (album.grid) {
    return (
      <div className={styles.grid}>
        {photos.map((photo, index) => (
          <div className={styles.cell} key={photo.id}>
            <LazyMediaPhoto
              media={photo}
              user={user}
              openLabel={`Открыть фото ${index + 1}`}
              onOpen={() => {
                album.select(index);
                open(index);
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={styles.stack}
      data-dragging={album.offset !== 0 && !album.moving}
      role="group"
      aria-label="Фото встречи. Листайте клавишами влево и вправо"
      tabIndex={0}
      onKeyDown={album.keyboard}
      onPointerDown={album.start}
      onPointerMove={album.move}
      onPointerUp={album.end}
      onPointerCancel={album.cancel}
      onLostPointerCapture={album.cancel}
    >
      {Array.from({ length: Math.min(3, photos.length) }, (_, depth) => ({
        photo: photos[(album.index + depth) % photos.length],
        depth,
      }))
        .reverse()
        .map(({ photo, depth }) => {
          if (!photo) {
            return null;
          }

          return (
            <div
              key={photo.id}
              className={styles.card}
              data-front={depth === 0}
              style={
                {
                  '--depth': depth,
                  '--drag': `${depth === 0 ? album.offset : 0}px`,
                  '--tilt': `${depth === 0 ? album.offset / 35 : 0}deg`,
                } as CSSProperties
              }
            >
              <MediaPhoto
                media={photo}
                user={user}
                passive={depth !== 0}
                openLabel={`Открыть фото ${album.index + 1}`}
                onOpen={
                  depth === 0
                    ? () => {
                        if (album.canOpen()) {
                          open(album.index);
                        }
                      }
                    : undefined
                }
              />
            </div>
          );
        })}
    </div>
  );
};
