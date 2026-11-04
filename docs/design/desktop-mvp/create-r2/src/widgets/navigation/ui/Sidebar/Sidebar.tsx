import { CalendarDays, Ticket } from "lucide-react";
import styles from "@create/widgets/navigation/ui/Sidebar/Sidebar.module.css";

export type SidebarProps = { onNavigate: (destination: string) => void };

export const Sidebar = ({ onNavigate }: SidebarProps) => (
  <aside className={styles.sidebar} aria-label="Навигация somewhere">
    <div className={styles.brand}>
      <img src="./somewhere.svg?shape=round-r1" alt="" width="32" height="32" />
      <span>somewhere</span>
    </div>
    <nav className={styles.nav} aria-label="Основные разделы">
      <button
        type="button"
        title="Мои встречи"
        aria-current="page"
        onClick={() => {
          onNavigate("../desktop-list-r2/preview.html");
        }}
      >
        <CalendarDays size={21} />
        <span>Мои встречи</span>
      </button>
      <button
        type="button"
        title="Приглашения"
        onClick={() => onNavigate("../desktop-invitations-r1/preview.html")}
      >
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
