import styles from "@invite/shared/ui/Brand/Brand.module.css";

export const Brand = () => (
  <a
    className={styles.brand}
    href="../desktop-entry-r5/preview.html"
    aria-label="somewhere — о продукте"
  >
    <img src="./somewhere.svg?shape=round-r1" width="36" height="36" alt="" />
    <span>somewhere</span>
  </a>
);
