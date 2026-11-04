import { useLayoutEffect, useRef } from "react";
import { X } from "lucide-react";
import { useSlideMotion } from "@preview/useSlideMotion";
import type { CSSProperties } from "react";
import { useVibeModel } from "@preview/VibeContext";
import styles from "@preview/ui/PhotoViewer/PhotoViewer.module.css";
export const PhotoViewer = () => {
  const m = useVibeModel(),
    ref = useRef<HTMLDialogElement>(null),
    gesture = useSlideMotion(m.photos.length, m.change),
    index = m.viewer ?? 0;
  useLayoutEffect(() => {
    const el = ref.current,
      previous = document.activeElement;
    el?.showModal();
    return () => {
      el?.close();
      const deck = document.querySelector<HTMLElement>(
        '[data-testid="photo-deck"]',
      );
      if (deck) deck.focus({ preventScroll: true });
      else if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);
  return (
    <dialog
      ref={ref}
      className={styles.viewer}
      aria-label="Фото встречи"
      onCancel={(event) => {
        event.preventDefault();
        m.closeViewer();
      }}
      onKeyDown={gesture.key}
    >
      <header className={styles.header}>
        <div>
          <strong>Пятница без спешки</strong>
          <p aria-live="polite">
            {index + 1} / {m.photos.length}
          </p>
        </div>
        <button
          type="button"
          aria-label="Закрыть просмотр"
          onClick={m.closeViewer}
        >
          <X size={22} />
        </button>
      </header>
      <div
        ref={gesture.element}
        className={styles.photo}
        data-testid="full-photo"
        data-phase={gesture.phase}
        onPointerDown={gesture.down}
        onPointerMove={gesture.move}
        onPointerUp={gesture.up}
        onPointerCancel={gesture.cancel}
        onLostPointerCapture={gesture.cancel}
      >
        <div
          className={styles.track}
          style={{ "--offset": gesture.offset + "px" } as CSSProperties}
        >
          {[-1, 0, 1].map((step) => {
            const i = (index + step + m.photos.length) % m.photos.length;
            return (
              <div key={step} className={styles.slide} aria-hidden={step !== 0}>
                <img
                  src={m.photos[i].src}
                  alt={step === 0 ? "Фото " + (index + 1) + " со встречи" : ""}
                  aria-hidden={step !== 0}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </dialog>
  );
};
