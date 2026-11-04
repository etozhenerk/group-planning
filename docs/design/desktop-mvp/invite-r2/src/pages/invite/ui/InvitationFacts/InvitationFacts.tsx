import { CalendarDays, Clock3, MapPin } from "lucide-react";
import styles from "@invite/pages/invite/ui/InvitationFacts/InvitationFacts.module.css";

export type InvitationFactsProps = { noTime: boolean; noPlace: boolean };
export const InvitationFacts = ({ noTime, noPlace }: InvitationFactsProps) => (
  <div className={styles.facts}>
    <div className={styles.when}>
      <div className={styles.fact}>
        <CalendarDays size={20} strokeWidth={1.6} />
        <span>
          <strong>Пятница, 6 ноября</strong>
          <small>2026 год</small>
        </span>
      </div>
      <div className={styles.fact}>
        <Clock3 size={20} strokeWidth={1.6} />
        <span>
          <strong>{noTime ? "Время уточняется" : "20:00"}</strong>
          {!noTime && <small>По Москве</small>}
        </span>
      </div>
    </div>
    <div className={styles.fact}>
      <MapPin size={20} strokeWidth={1.6} />
      <span>
        <strong>{noPlace ? "Место ещё не выбрано" : "Кафе «Соседи»"}</strong>
        {!noPlace && <small>Москва, Покровка, 8</small>}
      </span>
    </div>
  </div>
);
