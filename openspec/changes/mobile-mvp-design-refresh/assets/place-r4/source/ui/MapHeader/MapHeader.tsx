import { ArrowLeft } from "lucide-react";
import styles from "@preview/ui/MapHeader/MapHeader.module.css";
export type MapHeaderProps = { back: () => void };
export const MapHeader = ({ back, label="К предложению места" }: MapHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.bar}>
      <button type="button" onClick={back} aria-label={label}>
        <ArrowLeft size={22} />
      </button>
      <h2>Выбрать место</h2>
    </div>
  </header>
);
