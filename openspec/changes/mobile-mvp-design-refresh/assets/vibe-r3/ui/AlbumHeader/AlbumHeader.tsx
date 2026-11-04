import { ArrowLeft, Plus, Download, Grid2X2, Layers } from "lucide-react";
import { ButtonSpinner } from "@/shared/ui/ButtonSpinner";
import { useVibeModel } from "@preview/VibeContext";
import { AlbumNotice } from "@preview/ui/AlbumNotice";
import styles from "@preview/ui/AlbumHeader/AlbumHeader.module.css";
export const AlbumHeader = () => {
  const m = useVibeModel(),
    saving = m.download.phase === "preparing",
    writing = m.download.phase === "writing";
  return (
    <header className={styles.header}>
      <div className={styles.nav}>
        <a
          className={styles.back}
          href="../calendar-r7/frame.html?view=list&period=past"
        >
          <ArrowLeft size={20} />
          <span>Назад</span>
        </a>
        {!m.denied && m.photos.length > 0 && (
          <div className={styles.view} data-testid="album-view-controls">
            <span aria-live="polite" data-testid="album-counter">
              {m.album.index + 1}
              <span className={styles.total}> / {m.photos.length}</span>
            </span>
            <button
              type="button"
              onClick={() => m.album.setGrid(!m.album.grid)}
              aria-label={m.album.grid ? "Показать стопкой" : "Показать сеткой"}
            >
              {m.album.grid ? <Layers size={19} /> : <Grid2X2 size={19} />}
            </button>
          </div>
        )}
      </div>
      <h1>Пятница без спешки</h1>
      <p className={styles.facts}>30 октября · У Лены</p>
      {!m.denied && (
        <>
          <div
            className={styles.actions}
            role="group"
            aria-label="Действия с альбомом"
          >
            <button
              type="button"
              className={styles.add}
              onClick={m.chooseUpload}
            >
              <Plus size={18} />
              <span>Добавить фото</span>
            </button>
            {m.photos.length > 0 && (
              <button
                type="button"
                className={styles.save}
                onClick={saving ? m.download.cancel : m.download.start}
                disabled={writing}
                aria-label={
                  saving
                    ? "Отменить подготовку фотографий"
                    : writing
                      ? "Сохраняем фотографии"
                      : "Сохранить все фото"
                }
              >
                {saving || writing ? <ButtonSpinner /> : <Download size={18} />}
                <span>
                  {saving
                    ? "Отменить"
                    : writing
                      ? "Сохраняем…"
                      : "Сохранить все"}
                </span>
              </button>
            )}
          </div>
          <AlbumNotice />
        </>
      )}
    </header>
  );
};
