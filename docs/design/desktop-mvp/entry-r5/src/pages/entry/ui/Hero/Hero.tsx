import { PrimaryAction } from "@prototype/shared/ui/PrimaryAction";
import { ArrowDown } from "lucide-react";
import { HeroPicture } from "@prototype/pages/entry/ui/HeroPicture/HeroPicture";
import styles from "@prototype/pages/entry/ui/Hero/Hero.module.css";

export type HeroProps = { onSignIn: () => void };

export const Hero = ({ onSignIn }: HeroProps) => (
  <section className={styles.hero} aria-labelledby="hero-title">
    <div className={styles.copy}>
      <p className={styles.eyebrow}>Встречи с друзьями</p>
      <h1 id="hero-title">
        Позовите
        <br />
        друзей
        <br />
        <span>на встречу.</span>
      </h1>
      <p className={styles.description}>
        Назначьте дату и отправьте ссылку.
        <br />
        По ответам друзей будет понятно, кого ждать.
      </p>
      <PrimaryAction label="Попробовать" onClick={onSignIn} />
      <a className={styles.more} href="#meetings">
        <ArrowDown size={16} />
        Посмотреть возможности
      </a>
    </div>
    <HeroPicture />
  </section>
);
