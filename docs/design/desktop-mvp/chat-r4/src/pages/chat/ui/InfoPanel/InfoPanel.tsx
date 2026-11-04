import { CalendarDays, MapPin, Users, X } from "lucide-react";
import { meeting, people, user } from "@preview/data";
import { ResponseButtons } from "@/features/respond/ui/ResponseButtons";
import styles from "@desktop/pages/chat/ui/InfoPanel/InfoPanel.module.css";

export type InfoPanelProps = {
  onClose: () => void;
  onShare: () => void;
  compact?: boolean;
};

export const InfoPanel = ({
  onClose,
  onShare,
  compact = false,
}: InfoPanelProps) => (
  <aside
    className={styles.panel}
    data-compact={compact}
    aria-label="Информация о встрече"
  >
    <header className={styles.heading}>
      <h2>О встрече</h2>
      <button type="button" onClick={onClose} aria-label="Закрыть информацию">
        <X size={19} />
      </button>
    </header>
    <div className={styles.body}>
      <img
        className={styles.cover}
        src="./dinner.png"
        alt="Накрытый стол в кафе"
      />
      <h3>{meeting.title}</h3>
      <p className={styles.description}>{meeting.description}</p>
      <div className={styles.fact}>
        <CalendarDays size={18} strokeWidth={1.7} />
        <div>
          Пятница, 6 ноября<small>20:00 · Москва</small>
        </div>
      </div>
      <div className={styles.fact}>
        <MapPin size={18} strokeWidth={1.7} />
        <div>
          Кафе «Соседи»<small>Покровка, 8</small>
        </div>
      </div>
      <div className={styles.participantHeading}>
        <Users size={17} strokeWidth={1.7} />
        <h4>Участники</h4>
        <span>6</span>
      </div>
      <ul className={styles.people}>
        {[
          ...people,
          { id: "misha", display_name: "Миша" },
          { id: "anya", display_name: "Аня" },
          { id: "olya", display_name: "Оля" },
        ].map((person) => (
          <li key={person.id}>
            <img src={"./avatars/" + person.id + ".jpg"} alt="" />
            <div>
              {person.display_name}
              <small>
                {person.id === "lena"
                  ? "Организатор"
                  : person.id === "misha"
                    ? "Это вы"
                    : "Придёт"}
              </small>
            </div>
          </li>
        ))}
      </ul>
      {meeting.organizerId === user.user.id ? (
        <button className={styles.share} type="button" onClick={onShare}>
          Поделиться приглашением
        </button>
      ) : (
        <section
          className={styles.answer}
          aria-label="Ваш подтверждённый ответ — Приду"
        >
          <h4>Ваш ответ</h4>
          <div inert>
            <ResponseButtons
              session={user}
              id={meeting.id}
              expected={meeting.myRsvpRevision}
              current={meeting.myRsvp}
              inMeeting
            />
          </div>
        </section>
      )}
    </div>
  </aside>
);
