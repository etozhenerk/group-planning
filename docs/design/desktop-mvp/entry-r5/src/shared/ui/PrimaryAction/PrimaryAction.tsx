import { ArrowRight } from "lucide-react";
import styles from "@prototype/shared/ui/PrimaryAction/PrimaryAction.module.css";

export type PrimaryActionProps = { label: string; onClick: () => void };

export const PrimaryAction = ({ label, onClick }: PrimaryActionProps) => (
  <button className={styles.button} type="button" onClick={onClick}>
    <span>{label}</span>
    <ArrowRight size={20} aria-hidden="true" />
  </button>
);
