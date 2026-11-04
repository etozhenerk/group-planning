import { PrimaryAction } from "@prototype/shared/ui/PrimaryAction";
import styles from "@prototype/pages/entry/ui/EntryFooter/EntryFooter.module.css";

export type EntryFooterProps = { onSignIn: () => void };

export const EntryFooter = ({ onSignIn }: EntryFooterProps) => (
  <>
    <section className={styles.start} aria-labelledby="start-title">
      <h2 id="start-title">Откройте свои встречи.</h2>
      <PrimaryAction label="Попробовать" onClick={onSignIn} />
    </section>
    <footer className={styles.footer}>
      <span>Developed by MintyDev</span>
      <nav aria-label="Информация">
        <a href="../help-r2/preview.html">Помощь</a>
        <a href="../about-r2/preview.html?state=privacy">Конфиденциальность</a>
        <a href="../about-r2/preview.html?state=cookies">Cookie</a>
      </nav>
    </footer>
  </>
);
