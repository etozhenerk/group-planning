import { FilePenLine } from 'lucide-react';
import styles from '@/pages/service/ui/MobileDocumentStatus/MobileDocumentStatus.module.css';

export const MobileDocumentStatus = () => (
  <aside className={styles.status}>
    <div>
      <FilePenLine size={18} strokeWidth={1.6} />
      <strong>Проект документа</strong>
    </div>
    <p>Условия обработки и хранения уточним перед публикацией.</p>
  </aside>
);
