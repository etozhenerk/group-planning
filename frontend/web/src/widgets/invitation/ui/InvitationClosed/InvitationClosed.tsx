import { LockKeyhole } from 'lucide-react';
import type { Answer } from '@/shared/api';
import { answerLabels } from '@/entities/meeting';
import styles from '@/widgets/invitation/ui/InvitationClosed/InvitationClosed.module.css';

export type InvitationClosedProps = { answer: Answer | null };

export const InvitationClosed = ({ answer }: InvitationClosedProps) => (
  <div className={styles.closed} role="status">
    <span className={styles.icon}>
      <LockKeyhole aria-hidden="true" />
    </span>
    <div>
      <strong>Участие закрыто</strong>
      <p>
        {answer
          ? `Вы ответили «${answerLabels[answer]}».`
          : 'Новых участников больше не принимают.'}
      </p>
    </div>
  </div>
);
