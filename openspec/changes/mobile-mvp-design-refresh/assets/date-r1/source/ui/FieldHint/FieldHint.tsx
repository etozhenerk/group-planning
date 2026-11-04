import { TriangleAlert } from 'lucide-react';
import styles from '@preview/ui/FieldHint/FieldHint.module.css';
type FieldHintProps = { text: string; id?: string; pullUp?: boolean };
export const FieldHint = ({ text, id, pullUp = false }: FieldHintProps) => (
  <span id={id} className={styles.hint} data-pull-up={pullUp} role="alert">
    <TriangleAlert size={14} strokeWidth={1.7} aria-hidden="true" />
    <span>{text}</span>
  </span>
);
