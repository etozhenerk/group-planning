import { FilePenLine } from "lucide-react";
import styles from "@a/ui/DocumentStatus/DocumentStatus.module.css";
export const DocumentStatus = () => (
  <aside className={styles.status}>
    <div>
      <FilePenLine size={18} strokeWidth={1.6} />
      <strong>Проект документа</strong>
    </div>
    <p>Условия обработки и хранения уточним перед публикацией.</p>
  </aside>
);
