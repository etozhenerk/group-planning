import { Dialog } from "@/shared/ui/Dialog";
import type { RefObject } from "react";
import styles from "@a/ui/DocumentIndex/DocumentIndex.module.css";
export type DocumentIndexProps = {
  open: boolean;
  close: () => void;
  trigger: RefObject<HTMLButtonElement | null>;
  items: { key: string; title: string }[];
  choose: (key: string) => void;
};
export const DocumentIndex = ({
  open,
  close,
  trigger,
  items,
  choose,
}: DocumentIndexProps) => (
  <Dialog
    open={open}
    title="Содержание"
    onClose={close}
    returnFocus={trigger}
    chatAction
  >
    <nav className={styles.index} aria-label="Разделы документа">
      {items.map((item) => (
        <button key={item.key} type="button" onClick={() => choose(item.key)}>
          {item.title}
        </button>
      ))}
    </nav>
  </Dialog>
);
