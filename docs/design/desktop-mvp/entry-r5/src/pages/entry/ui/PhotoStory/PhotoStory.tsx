import { Download } from "lucide-react";
import styles from "@prototype/pages/entry/ui/PhotoStory/PhotoStory.module.css";

export const PhotoStory = () => (
  <section
    id="photos"
    className={styles.section}
    aria-labelledby="photos-title"
  >
    <div className={styles.copy}>
      <h2 id="photos-title">
        Соберите фотографии
        <br />
        встречи.
      </h2>
      <p>
        Участники могут добавить свои снимки. Смотрите их в общем альбоме или
        скачайте все фотографии сразу.
      </p>
    </div>
    <div
      className={styles.photos}
      aria-label="Две фотографии из альбома встречи"
    >
      <figure className={styles.first}>
        <img src="./dinner.png" alt="Вечер за общим столом" />
        <figcaption>Настолки у Саши</figcaption>
      </figure>
      <figure className={styles.second}>
        <img src="./boardgame.png" alt="Настольная игра и пицца" />
      </figure>
      <div className={styles.album}>
        <span>
          Настолки у Саши <small>Фотографии встречи</small>
        </span>
        <span className={styles.download}>
          <Download size={16} aria-hidden="true" /> Сохранить все
        </span>
      </div>
    </div>
  </section>
);
