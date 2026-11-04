import { useVibeModel } from "@preview/VibeContext";
import { PhotoDeck } from "@preview/ui/PhotoDeck";
import { AlbumState } from "@preview/ui/AlbumState";
import styles from "@preview/ui/AlbumGallery/AlbumGallery.module.css";
export const AlbumGallery = () => {
  const m = useVibeModel();
  if (m.denied) return <AlbumState kind="denied" />;
  if (m.mode === "loading") return <AlbumState kind="loading" />;
  if (m.mode === "error" && !m.recovered) return <AlbumState kind="error" />;
  if (!m.photos.length) return <AlbumState kind="empty" />;
  return (
    <div className={styles.gallery}>
      {m.album.grid ? (
        <div className={styles.grid}>
          {m.photos.map((photo, index) => (
            <button
              key={photo.id}
              type="button"
              aria-label={"Открыть фото " + (index + 1)}
              onClick={() => m.open(index)}
            >
              <img src={photo.src} alt="" loading="eager" draggable={false} />
            </button>
          ))}
        </div>
      ) : (
        <PhotoDeck />
      )}
    </div>
  );
};
