import styles from '@/pages/service/ui/MobileAboutBrand/MobileAboutBrand.module.css';

export type MobileAboutBrandProps = Record<string, never>;

export const MobileAboutBrand = () => (
  <section className={styles.brand} aria-label="somewhere">
    <div className={styles.lockup}>
      <img src="/somewhere.svg" alt="" />
      <span>somewhere</span>
    </div>
    <p>Договориться о встрече, обсудить детали и сохранить её вайб.</p>
  </section>
);
