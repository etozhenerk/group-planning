import type { CSSProperties } from "react";
import { ImageOff } from "lucide-react";
import { useVibeModel } from "@preview/VibeContext";
import styles from "@preview/ui/PhotoDeck/PhotoDeck.module.css";
export const PhotoDeck = () => {
  const m = useVibeModel(),
    a = m.album;
  return (
    <div
      ref={a.element}
      className={styles.deck}
      data-testid="photo-deck"
      data-resetting={a.resetting}
      data-phase={a.phase}
      data-offset={a.offset}
      style={{ "--duration": a.duration + "ms" } as CSSProperties}
      data-moving={a.moving}
      data-dragging={a.offset !== 0 && !a.moving}
      role="group"
      aria-label="Фото встречи"
      tabIndex={0}
      onKeyDown={a.keyboard}
      onPointerDown={a.start}
      onPointerMove={a.move}
      onPointerUp={a.end}
      onPointerCancel={a.cancel}
      onLostPointerCapture={a.lostCapture}
    >
      {Array.from({ length: Math.min(3, m.photos.length) }, (_, depth) => ({
        photo: m.photos[(a.index + depth) % m.photos.length],
        depth,
      }))
        .reverse()
        .map(({ photo, depth }) => (
          <div
            key={photo.id}
            className={styles.card}
            data-front={depth === 0}
            data-recycling={
              a.recycledIndex === (a.index + depth) % m.photos.length
            }
            style={
              {
                "--depth": depth,
                "--drag": (depth === 0 ? a.offset : 0) + "px",
                "--angle":
                  (depth === 0
                    ? -2 + Math.max(-14, Math.min(14, a.offset / 35))
                    : depth * 8 - 2 - a.progress * 8) + "deg",
                "--dy": (depth === 0 ? a.vertical : 0) + "px",
              } as CSSProperties
            }
          >
            {depth === 0 && m.mode === "photo-error" && !m.recovered ? (
              <div className={styles.unavailable}>
                <ImageOff size={26} />
                <strong>Фото недоступно</strong>
                <button type="button" onClick={m.retry}>
                  Повторить
                </button>
              </div>
            ) : (
              <button
                type="button"
                tabIndex={depth === 0 ? 0 : -1}
                aria-hidden={depth !== 0}
                aria-label={"Открыть фото " + (a.index + 1)}
                onClick={() => {
                  if (depth === 0 && a.canOpen()) m.open(a.index);
                }}
              >
                <img src={photo.src} alt="" draggable={false} />
              </button>
            )}
          </div>
        ))}
    </div>
  );
};
