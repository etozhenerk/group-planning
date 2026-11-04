import { Images, ImageOff, LockKeyhole } from "lucide-react";
import { useVibeModel } from "@preview/VibeContext";
import styles from "@preview/ui/AlbumState/AlbumState.module.css";
export type AlbumStateProps = {
  kind: "empty" | "error" | "loading" | "denied";
};
export const AlbumState = ({ kind }: AlbumStateProps) => {
  const m = useVibeModel();
  return (
    <section
      className={styles.state}
      role={kind === "loading" ? "status" : undefined}
    >
      {kind === "loading" ? (
        <>
          <div className={styles.skeleton} />
          <p>Загружаем фото…</p>
        </>
      ) : (
        <>
          <div className={styles.icon}>
            {kind === "denied" ? (
              <LockKeyhole size={30} />
            ) : kind === "error" ? (
              <ImageOff size={30} />
            ) : (
              <Images size={30} />
            )}
          </div>
          <h2>
            {kind === "empty"
              ? "Как всё прошло?"
              : kind === "denied"
                ? "Доступ к фото закрыт"
                : "Альбом не загрузился"}
          </h2>
          <p>
            {kind === "empty"
              ? "Добавьте фото встречи — их увидят участники."
              : kind === "denied"
                ? "Фото доступны участникам встречи."
                : "Не удалось получить фотографии. Попробуйте ещё раз."}
          </p>
          {kind === "error" && (
            <button type="button" onClick={m.retry}>
              Повторить загрузку
            </button>
          )}
        </>
      )}
    </section>
  );
};
