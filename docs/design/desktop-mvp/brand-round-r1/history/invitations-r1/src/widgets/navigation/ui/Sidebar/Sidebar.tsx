import { CalendarDays, Ticket } from "lucide-react";
import styles from "@inv/widgets/navigation/ui/Sidebar/Sidebar.module.css";

export const Sidebar = () => (
  <aside className={styles.sidebar} aria-label="Навигация somewhere">
    <div className={styles.brand}>
      <img src="./somewhere.svg" alt="" width="32" height="32" />
      <span>somewhere</span>
    </div>
    <nav className={styles.nav} aria-label="Основные разделы">
      <button
        type="button"
        title="Мои встречи"
        onClick={() => {
          location.href = "../desktop-list-r2/preview.html";
        }}
      >
        <CalendarDays size={21} />
        <span>Мои встречи</span>
      </button>
      <button type="button" aria-current="page" title="Приглашения">
        <Ticket size={21} />
        <span>Приглашения</span>
      </button>
    </nav>
    <button
      type="button"
      className={styles.identity}
      aria-label="Профиль: Миша"
      title="Открыть профиль"
    >
      <img src="./avatars/misha.jpg" alt="" />
      <span>
        Миша<small>Профиль</small>
      </span>
    </button>
  </aside>
);
