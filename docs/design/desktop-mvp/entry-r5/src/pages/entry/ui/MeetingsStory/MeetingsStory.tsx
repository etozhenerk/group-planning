import { useState } from "react";
import { List, CalendarDays } from "lucide-react";
import { CalendarGrid } from "@/pages/meetings/ui/CalendarGrid";
import { MeetingCard } from "@prototype/entities/meeting";
import { meeting, calendar, noop } from "@prototype/pages/entry/model/fixtures";
import styles from "@prototype/pages/entry/ui/MeetingsStory/MeetingsStory.module.css";

export const MeetingsStory = () => {
  const [view, setView] = useState<"list" | "calendar">("list");
  return (
    <section
      id="meetings"
      className={styles.section}
      aria-labelledby="meetings-title"
    >
      <div className={styles.copy}>
        <h2 id="meetings-title">
          Встречи —<br />в списке и календаре.
        </h2>
        <p>
          Откройте весь список или выберите день, чтобы посмотреть
          запланированные встречи.
        </p>
      </div>
      <div className={styles.stage}>
        <header>
          <strong>Мои встречи</strong>
          <nav aria-label="Пример списка и календаря">
            <span data-calendar={view === "calendar"} aria-hidden="true" />
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              <List size={16} />
              Список
            </button>
            <button
              type="button"
              aria-pressed={view === "calendar"}
              onClick={() => setView("calendar")}
            >
              <CalendarDays size={16} />
              Календарь
            </button>
          </nav>
        </header>
        <div className={styles.content} data-calendar={view === "calendar"}>
          <div
            className={styles.preview}
            inert
            role="img"
            aria-label={
              view === "list"
                ? "Карточки двух предстоящих встреч"
                : "Календарь со встречей 7 ноября"
            }
          >
            {view === "list" ? (
              <>
                <MeetingCard
                  meeting={{
                    ...meeting,
                    id: "first",
                    coverUrl: "/boardgame",
                    unreadCount: "2",
                  }}
                />
                <MeetingCard
                  meeting={{
                    ...meeting,
                    id: "second",
                    title: "Кофе в воскресенье",
                    coverUrl: null,
                    startsAt: "2026-11-08T09:00:00Z",
                    startsOn: "2026-11-08",
                    participantCount: 3,
                    unreadCount: "0",
                  }}
                />
              </>
            ) : (
              <CalendarGrid day="2026-11-07" page={calendar} onSelect={noop} />
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
