import { useMobileLayout } from "@/shared/lib/media";
import { useId } from "react";
import styles from "@h/ui/HelpQuestion/HelpQuestion.module.css";

export type HelpQuestionProps = {
  title: string;
  text: string;
  open: boolean;
  toggle: () => void;
};

export const HelpQuestion = ({
  title,
  text,
  open,
  toggle,
}: HelpQuestionProps) => {
  const mobile = useMobileLayout();
  const id = useId();

  return (
    <section className={styles.item} data-mobile={mobile}>
      <button
        className={styles.question}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={toggle}
      >
        {title}
        <span className={styles.symbol} aria-hidden="true" />
      </button>
      <div className={styles.answer} id={id} aria-hidden={!open} inert={!open}>
        <div>
          <p>{text}</p>
        </div>
      </div>
    </section>
  );
};
