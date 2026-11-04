import { ArrowDown } from "lucide-react";
import styles from "@message/entities/chat/ui/FileContent/FileContent.module.css";

export type FileContentProps = { name: string; details: string };

export const FileContent = ({ name, details }: FileContentProps) => (
  <span className={styles.file}>
    <span className={styles.download} aria-hidden="true">
      <ArrowDown size={20} strokeWidth={1.7} />
    </span>
    <span className={styles.text}>
      <strong>{name}</strong>
      <small>{details}</small>
    </span>
  </span>
);
