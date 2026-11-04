import { ArrowUpRight } from "lucide-react";
import styles from "@prototype/pages/entry/ui/PageHeader/PageHeader.module.css";

export type PageHeaderProps = { onSignIn: () => void };

export const PageHeader = ({ onSignIn }: PageHeaderProps) => (
  <header className={styles.header}>
    <a className={styles.brand} href="#top" aria-label="somewhere — в начало">
      <img src="./somewhere.svg" width="32" height="32" alt="" />
      <span>somewhere</span>
    </a>
    <nav className={styles.links} aria-label="Знакомство">
      <a href="#meetings">Возможности</a>
      <a href="#photos">Фотографии встречи</a>
    </nav>
    <button className={styles.signin} type="button" onClick={onSignIn}>
      Войти
      <ArrowUpRight size={16} />
    </button>
  </header>
);
