import { LogOut } from "lucide-react";
import styles from "@p/ui/SignedOut/SignedOut.module.css";
export type SignedOutProps = { again: () => void };
export const SignedOut = ({ again }: SignedOutProps) => (
  <main className={styles.page}>
    <LogOut size={32} strokeWidth={1.5} />
    <h1>Вы вышли из аккаунта</h1>
    <button type="button" onClick={again}>
      Войти через Яндекс ID
    </button>
  </main>
);
