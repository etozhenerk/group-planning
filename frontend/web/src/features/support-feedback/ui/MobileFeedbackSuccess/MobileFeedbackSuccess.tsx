import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import { Check } from 'lucide-react';
import { MobilePageHeader } from '@/features/support-feedback/ui/MobilePageHeader/MobilePageHeader';
import styles from '@/features/support-feedback/ui/MobileFeedbackSuccess/MobileFeedbackSuccess.module.css';

export type MobileFeedbackSuccessProps = { reference: string; reset: () => void };

export const MobileFeedbackSuccess = ({
  reference,
  reset,
}: MobileFeedbackSuccessProps) => {
  const receipt = useRef<HTMLElement>(null);
  const clear = useRef(reset);
  clear.current = reset;
  useEffect(
    () => () => {
      if (!receipt.current?.isConnected) {
        clear.current();
      }
    },
    [],
  );

  return (
    <main id="main" className={styles.page}>
      <div
        onClickCapture={(event) => {
          if ((event.target as HTMLElement).closest('a')) {
            reset();
          }
        }}
      >
        <MobilePageHeader title="Поддержка" success />
      </div>
      <section ref={receipt} className={styles.receipt} role="status">
        <div className={styles.icon}>
          <Check aria-hidden="true" />
        </div>
        <h2>Обращение принято</h2>
        <p>Номер обращения</p>
        <strong className={styles.number}>{reference}</strong>
        <Link to="/help" onClick={reset}>
          К помощи
        </Link>
      </section>
    </main>
  );
};
