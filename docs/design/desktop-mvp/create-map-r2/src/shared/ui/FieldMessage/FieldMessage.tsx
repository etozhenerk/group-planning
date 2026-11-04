import { TriangleAlert } from "lucide-react";
import styles from "@future/shared/ui/FieldMessage/FieldMessage.module.css";

export type FieldMessageProps = { id: string; error?: string; hint?: string };
export const FieldMessage = ({
  id,
  error = "",
  hint = "",
}: FieldMessageProps) => (
  <div id={id} className={styles.slot} data-error={!!error} aria-live="polite">
    {error && <TriangleAlert size={14} strokeWidth={1.7} aria-hidden="true" />}
    <span>{error || hint}</span>
  </div>
);
