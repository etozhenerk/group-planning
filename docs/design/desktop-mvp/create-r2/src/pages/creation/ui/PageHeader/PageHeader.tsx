import { ChevronLeft } from "lucide-react";
import styles from "@create/pages/creation/ui/PageHeader/PageHeader.module.css";

export type PageHeaderProps = { onBack: () => void };
export const PageHeader = ({ onBack }: PageHeaderProps) => (
  <header className={styles.header}>
    <div className={styles.inner}>
      <button
        type="button"
        className={styles.back}
        aria-label="Вернуться к моим встречам"
        onClick={onBack}
      >
        <ChevronLeft size={24} strokeWidth={1.7} />
      </button>
      <div className={styles.title}>
        <h1>Новая встреча</h1>
        <p>
          <span aria-hidden="true">*</span> — обязательные поля
        </p>
      </div>
    </div>
  </header>
);
