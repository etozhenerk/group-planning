import { useMobileLayout } from '@/shared/lib/media';
import { useId, useState } from 'react';
import styles from '@/pages/service/ui/HelpQuestion/HelpQuestion.module.css';

export type HelpQuestionProps = {
  title: string;
  text: string;
  initiallyOpen: boolean;
  expanded?: boolean;
  toggle?: () => void;
};

export const HelpQuestion = ({
  title,
  text,
  initiallyOpen,
  expanded,
  toggle,
}: HelpQuestionProps) => {
  const mobile = useMobileLayout();
  const [localOpen, setOpen] = useState(initiallyOpen);
  const open = expanded ?? localOpen;
  const id = useId();

  return (
    <section className={styles.item} data-mobile={mobile}>
      <button
        className={styles.question}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => (toggle ? toggle() : setOpen(!open))}
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
