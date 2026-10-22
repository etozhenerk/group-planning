import { ChartNoAxesColumnIncreasing } from 'lucide-react';
import { useDatePoll, useMeeting } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { PollBallot } from '@/features/date-poll/ui/PollBallot';
import { PollAddOption } from '@/features/date-poll/ui/PollAddOption';
import { PollResolution } from '@/features/date-poll/ui/PollResolution';
import { pollStatus, pollError } from '@/features/date-poll/model/pollCopy';
import styles from '@/features/date-poll/ui/DatePollCard/DatePollCard.module.css';

export type DatePollCardProps = { meeting: string; id: string; session: Session };

export const DatePollCard = ({ meeting, id, session }: DatePollCardProps) => {
  const query = useDatePoll(meeting, id, session.user.id);
  const details = useMeeting(meeting, session.user.id);

  if (query.access.denied) {
    return null;
  }

  const poll = query.data;
  const zone = details.data?.timezone ?? 'UTC';

  return (
    <section className={styles['card']} aria-label="Опрос о дате">
      <div className={styles['caption']}>
        <ChartNoAxesColumnIncreasing size={18} aria-hidden="true" />
        Предлагает изменить дату
      </div>
      <h3>Когда встречаемся?</h3>
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
            <span>{pollStatus(poll, zone)}</span>
            <span>
              {poll.settings.anonymous ? 'Анонимные голоса' : 'Открытые голоса'}
            </span>
          </div>
          {poll.state === 'open' && poll.settings.hideResults && (
            <p className={styles['note']}>Результаты появятся после окончания опроса.</p>
          )}
        </>
      ) : query.isPending ? (
        <p role="status">Загружаем опрос…</p>
      ) : null}
      {query.error && (
        <div role="alert">
          <p>{pollError(query.error)}</p>
          <button type="button" onClick={() => void query.refetch()}>
            Повторить
          </button>
        </div>
      )}
    </section>
  );
};
