import styles from "@a/ui/AboutBrand/AboutBrand.module.css";
export const AboutBrand = () => (
  <section className={styles.brand} aria-label="somewhere">
    <div className={styles.lockup}>
      <img src="./somewhere.svg" alt="" />
      <span>somewhere</span>
    </div>
    <p>Договориться о встрече, обсудить детали и сохранить её вайб.</p>
  </section>
);
