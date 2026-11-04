import { PeriodTabs } from "@list/pages/meetings/ui/PeriodTabs/PeriodTabs";
import { List, CalendarDays, Plus } from "lucide-react";
import styles from "@list/pages/meetings/ui/Header/Header.module.css";

export type HeaderProps = {
  period: "upcoming" | "past";
  view: "list" | "calendar";
  counts: { upcoming: number; past: number };
  unknown: boolean;
  empty: boolean;
  onPeriod: (period: "upcoming" | "past") => void;
  onView: (view: "list" | "calendar") => void;
};

export const Header = ({
  period,
  view,
  counts,
  unknown,
  empty,
  onPeriod,
  onView,
}: HeaderProps) => (
  <header className={styles.header}>
    <div className={styles.heading}>
      <h1>Мои встречи</h1>
      {(!empty || view === "calendar") && (
        <button type="button" className={styles.create}>
          <Plus size={19} strokeWidth={1.7} />
          Создать встречу
        </button>
      )}
    </div>
    <div className={styles.toolbar}>
      <PeriodTabs
        value={period}
        counts={counts}
        unknown={unknown}
        onChange={onPeriod}
      />
      <nav className={styles.views} aria-label="Вид встреч">
        <span
          className={styles.selection}
          data-calendar={view === "calendar"}
          aria-hidden="true"
        />
        <button
          type="button"
          aria-pressed={view === "list"}
          onClick={() => onView("list")}
        >
          <List size={17} aria-hidden="true" />
          Список
        </button>
        <button
          type="button"
          aria-pressed={view === "calendar"}
          onClick={() => onView("calendar")}
        >
          <CalendarDays size={17} aria-hidden="true" />
          Календарь
        </button>
      </nav>
    </div>
  </header>
);
