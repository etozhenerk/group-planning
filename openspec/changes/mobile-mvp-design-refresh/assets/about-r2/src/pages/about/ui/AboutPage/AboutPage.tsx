import { useLayoutEffect, useRef } from "react";
import { AboutHeader } from "@a/ui/AboutHeader";
import { AboutBrand } from "@a/ui/AboutBrand";
import { BuildDetails } from "@a/ui/BuildDetails";
import type { AboutModel } from "@a/model/useAboutPreview";
import styles from "@a/ui/AboutPage/AboutPage.module.css";
export type AboutPageProps = { model: AboutModel };
export const AboutPage = ({ model: m }: AboutPageProps) => {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (ref.current) ref.current.scrollTop = m.positions.current.about ?? 0;
    const el = ref.current;
    return () => {
      if (el) m.positions.current.about = el.scrollTop;
    };
  }, []);
  return (
    <main ref={ref} className={styles.page}>
      <AboutHeader />
      <div className={styles.content}>
        <AboutBrand />
        <BuildDetails model={m} />
        <p className={styles.credit}>
          Developed by <strong>MintyDev</strong>
        </p>
      </div>
    </main>
  );
};
