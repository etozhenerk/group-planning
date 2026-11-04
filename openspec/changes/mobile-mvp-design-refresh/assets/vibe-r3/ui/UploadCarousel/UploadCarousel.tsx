import { X } from "lucide-react";
import { useVibeModel } from "@preview/VibeContext";
import styles from "@preview/ui/UploadCarousel/UploadCarousel.module.css";
export const UploadCarousel = () => {
  const m = useVibeModel();
  return (
    <ul className={styles.carousel} aria-label="Выбранные фотографии">
      {m.upload.items.map((item) => (
        <li key={item.id} className={styles.item}>
          <div className={styles.photo}>
            <img src={item.src} alt={item.name} />
            <button
              type="button"
              disabled={m.upload.busy}
              aria-label={"Убрать " + item.name}
              onClick={() => m.upload.remove(item.id)}
            >
              <X size={18} />
            </button>
          </div>
          {item.error && !item.error.startsWith("Не удалось") && (
            <p role="alert">{item.error}</p>
          )}
        </li>
      ))}
    </ul>
  );
};
