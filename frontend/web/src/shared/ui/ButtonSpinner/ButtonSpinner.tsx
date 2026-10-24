import { LoaderCircle } from 'lucide-react';
import styles from '@/shared/ui/ButtonSpinner/ButtonSpinner.module.css';

export const ButtonSpinner = () => (
  <LoaderCircle size={20} className={styles.spinner} aria-hidden="true" />
);
