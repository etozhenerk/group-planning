import { TriangleAlert, Check, LoaderCircle } from "lucide-react";
import { useVibeModel } from "@preview/VibeContext";
import styles from "@preview/ui/AlbumNotice/AlbumNotice.module.css";
export const AlbumNotice = () => {
  const m = useVibeModel(),
    phase = m.download.phase;
  if (["idle", "writing"].includes(phase)) return null;
  const message =
    phase === "preparing"
      ? "Готовим все фото к сохранению…"
      : phase === "error"
        ? "Не удалось подготовить фотографии. Попробуйте ещё раз."
        : phase === "permission"
          ? "Разрешите сохранять фото в настройках приложения."
          : phase === "partial"
            ? "Часть фотографий могла сохраниться. Проверьте галерею перед повторной попыткой."
            : phase === "saved"
              ? "Фотографии сохранены"
              : "Скачивание началось";
  return (
    <div
      className={styles.notice}
      role={
        ["error", "permission", "partial"].includes(phase) ? "alert" : "status"
      }
    >
      {phase === "preparing" ? (
        <LoaderCircle size={16} />
      ) : ["error", "permission", "partial"].includes(phase) ? (
        <TriangleAlert size={16} />
      ) : (
        <Check size={16} />
      )}
      <div>
        <p>{message}</p>
        {phase === "error" && (
          <button type="button" onClick={m.download.start}>
            Повторить
          </button>
        )}
        {phase === "permission" && (
          <button type="button" onClick={m.download.dismiss}>
            Настройки
          </button>
        )}
        {phase === "partial" && (
          <button type="button" onClick={m.download.dismiss}>
            Понятно
          </button>
        )}
      </div>
    </div>
  );
};
