import { ChatIcon } from '@/shared/ui/ChatIcon';
import { SkeletonRows } from '@/shared/ui/SkeletonRows';
import type { DatePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PollBallot } from '@/features/date-poll/ui/PollBallot';
import { PollAddOption } from '@/features/date-poll/ui/PollAddOption';
import { PollResolution } from '@/features/date-poll/ui/PollResolution';
import { pollStatus, pollError } from '@/features/date-poll/model/pollCopy';
import styles from '@/features/date-poll/ui/DatePollCard/DatePollCard.module.css';

export type DatePollCardProps = {
  poll: DatePoll | undefined;
  session: Session;
  outgoing: boolean;
  zone: string;
  pending?: boolean;
  error?: unknown;
  retry?: () => void;
  now?: number;
};

export const DatePollCard = ({
  poll,
  session,
  outgoing,
  zone,
  pending = false,
  error,
  retry,
  now = Date.now(),
}: DatePollCardProps) => {
  return (
    <section
      className={[styles['card'], outgoing ? styles['outgoing'] : '']
        .filter(Boolean)
        .join(' ')}
      aria-label="Опрос о дате"
    >
      <div className={styles['caption']}>
        <ChatIcon name="calendar" size={18} aria-hidden="true" />
        Предлагает изменить дату
      </div>
      <h3>Новая дата встречи</h3>
      {poll ? (
        <>
          <p className={styles['note']}>
            {poll.settings.multipleAnswers
              ? 'Можно выбрать несколько вариантов.'
              : 'Выберите один вариант.'}
          </p>
          <PollBallot poll={poll} session={session} />
          <PollAddOption poll={poll} session={session} zone={zone} />
          <PollResolution poll={poll} session={session} zone={zone} />
          <div className={styles['footer']}>
            <span>{pollStatus(poll, zone, now)}</span>
            <span>
              {poll.settings.anonymous ? 'Анонимные голоса' : 'Открытые голоса'}
            </span>
          </div>
          {poll.state === 'open' && poll.settings.hideResults && (
            <p className={styles['note']}>Результаты появятся после окончания опроса.</p>
          )}
        </>
      ) : pending ? (
        <SkeletonRows label="Загрузка опроса" variant="agenda" />
      ) : null}
      {!!error && (
        <div role="alert">
          <p>{pollError(error)}</p>
          <button type="button" onClick={retry}>
            Повторить
          </button>
        </div>
      )}
    </section>
  );
};
