import { useRef } from "react";
import { Images, Plus, TriangleAlert } from "lucide-react";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import { useVibeModel } from "@preview/VibeContext";
import { UploadCarousel } from "@preview/ui/UploadCarousel";
import styles from "@preview/ui/UploadPanel/UploadPanel.module.css";
export const UploadPanel = () => {
  const m = useVibeModel(),
    input = useRef<HTMLInputElement>(null),
    items = m.upload.items;
  return (
    <div className={styles.panel}>
      <div className={styles.body}>
        {items.length ? (
          <>
            <p className={styles.count}>
              {m.mode === "partial" ? "Не добавлено фото: " : "Выбрано фото: "}
              {items.length}
            </p>
            <UploadCarousel />
          </>
        ) : (
          <div className={styles.empty}>
            <Images size={34} />
            <strong>Фото с вашей встречи</strong>
            <p>Выберите снимки — их увидят участники.</p>
          </div>
        )}
        <button
          className={styles.choose}
          type="button"
          disabled={m.upload.busy}
          onClick={() => input.current?.click()}
        >
          <Plus size={18} />
          {items.length ? "Выбрать ещё" : "Выбрать фото"}
        </button>
        <input
          ref={input}
          hidden
          type="file"
          accept="image/*"
          multiple
          aria-label="Файлы для альбома"
          onChange={(event) => {
            m.upload.choose(event.target.files);
            event.target.value = "";
          }}
        />
        {items.length > 0 && (
          <p className={styles.hint}>Видно участникам встречи</p>
        )}
        <div className={styles.footer} data-testid="upload-footer">
          {m.upload.problem && (
            <div className={styles.problem} role="alert">
              <TriangleAlert size={18} />
              <span>{m.upload.problem}</span>
            </div>
          )}
          <button
            className={styles.submit}
            type="button"
            disabled={
              !items.length ||
              m.upload.busy ||
              items.some(
                (item) => item.error && !item.error.startsWith("Не удалось"),
              )
            }
            aria-busy={m.upload.busy}
            aria-label={
              m.upload.busy
                ? "Добавляем фотографии"
                : m.upload.problem
                  ? "Повторить отправку"
                  : "Добавить в альбом"
            }
            onClick={m.upload.send}
          >
            {m.upload.busy ? (
              <>
                <ButtonSpinner />
                <span>Добавляем фото…</span>
              </>
            ) : m.upload.problem ? (
              "Повторить отправку"
            ) : (
              "Добавить в альбом"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
