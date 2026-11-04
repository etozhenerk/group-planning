import { Check } from "lucide-react";
import styles from "@invite/pages/invite/ui/DeclinedScreen/DeclinedScreen.module.css";

export type DeclinedScreenProps = { title: string };
export const DeclinedScreen = ({ title }: DeclinedScreenProps) => (
  <main className={styles.card}>
    <span className={styles.icon}>
      <Check size={28} strokeWidth={1.8} />
    </span>
    <h1>Вы ответили «Не смогу»</h1>
    <p className={styles.meeting}>{title}</p>
    <p className={styles.copy}>Организатор увидит ваш ответ.</p>
    <a href="../desktop-list-r2/preview.html?from=rsvp">К моим встречам</a>
  </main>
);
