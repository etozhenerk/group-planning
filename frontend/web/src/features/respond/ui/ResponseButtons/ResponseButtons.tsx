import { ActionNotice } from '@/shared/ui/ActionNotice';
import { useMobileLayout } from '@/shared/lib/media';
import styles from '@/features/respond/ui/ResponseButtons/ResponseButtons.module.css';
import { useRespond } from '@/features/respond/model/useRespond';
import type { Invitation } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import type { Answer } from '@/shared/api';
import { errorText } from '@/shared/api';
import { answerLabels } from '@/entities/meeting';

export type ResponseButtonsProps = {
  session: Session;
  id: string;
  title: string;
  preview: Invitation;
  token?: string;
  expected: string;
  current: Answer | null;
  joinDisabledReason?: string | null;
  inMeeting?: boolean;
};

export const ResponseButtons = ({
  session,
  id,
  title,
  preview,
  token,
  expected,
  current,
  joinDisabledReason = null,
  inMeeting = false,
}: ResponseButtonsProps) => {
  const action = useRespond({ session, id, token, expected, title, current, preview });
  const confirmed = current;
  const mobile = useMobileLayout();

  return (
    <div
      className={[styles.stack, inMeeting ? styles.meeting : ''].join(' ')}
      data-mobile={mobile}
    >
      {mobile && !inMeeting && action.mutation.error && (
        <ActionNotice
          title="Не удалось отправить ответ"
          text={errorText(action.mutation.error)}
        />
      )}
      <div className={styles['response-buttons']}>
        {(['going', 'maybe', 'not_going'] as const).map((answer) => (
          <button
            key={answer}
            type="button"
            className={answer === 'going' ? styles['primary'] : ''}
            aria-pressed={confirmed === answer}
            disabled={
              action.mutation.isPending ||
              (answer === 'going' && confirmed !== 'going' && !!joinDisabledReason)
            }
            onClick={() => action.mutation.mutate(answer)}
          >
            {answerLabels[answer]}
          </button>
        ))}
      </div>
      {action.mutation.isPending && <p role="status">Сохраняем ответ…</p>}
      {(!mobile || inMeeting) && action.mutation.error && (
        <p role="alert" className={styles['error']}>
          {errorText(action.mutation.error)}
        </p>
      )}
      {joinDisabledReason && confirmed !== 'going' && (
        <p role="status">{joinDisabledReason}</p>
      )}
      {confirmed !== 'going' && !joinDisabledReason && (
        <p className={styles['muted']}>После ответа «Приду» откроется общий чат.</p>
      )}
    </div>
  );
};
