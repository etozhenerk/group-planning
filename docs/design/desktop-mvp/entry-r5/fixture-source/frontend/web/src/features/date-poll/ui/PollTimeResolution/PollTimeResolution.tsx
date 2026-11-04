import { useState } from 'react';
import type { DatePoll } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { TimeInput } from '@/shared/ui/TimeInput';
import { SelectInput } from '@/shared/ui/SelectInput';
import { resolveTime, timezoneLabel } from '@/shared/lib/time';
import { usePollAction } from '@/features/date-poll/model/usePollAction';
import { pollError } from '@/features/date-poll/model/pollCopy';
import styles from '@/features/date-poll/ui/PollTimeResolution/PollTimeResolution.module.css';

export type PollTimeResolutionProps = { poll: DatePoll; session: Session; zone: string };

export const PollTimeResolution = ({ poll, session, zone }: PollTimeResolutionProps) => {
  const [hour, setHour] = useState('');
  const [choice, setChoice] = useState<'' | 'earlier' | 'later'>('');
  const [problem, setProblem] = useState('');
  const action = usePollAction(poll.meetingId, poll.id, session);
  const option = poll.options.find((item) => poll.leaderOptionIds.includes(item.id));

  return (
    <div className={styles['resolution']}>
      <p>
        Из-за перевода часов прежнее время нельзя перенести однозначно. Укажите время для
        выбранной даты или оставьте его на потом.
      </p>
      <small>{timezoneLabel(zone)}</small>
      <TimeInput
        value={hour}
        onChange={(value) => {
          setHour(value);
          setChoice('');
          setProblem('');
        }}
        disabled={action.isPending}
      />
      {problem.includes('дважды') && (
        <SelectInput
          label="Повторяющееся время"
          value={choice}
          onChange={(value) =>
            setChoice(value === 'earlier' || value === 'later' ? value : '')
          }
          options={[
            { value: 'earlier', content: 'До перевода часов' },
            { value: 'later', content: 'После перевода часов' },
          ]}
          placeholder="Выберите вариант"
          disabled={action.isPending}
        />
      )}
      <button
        type="button"
        disabled={!hour || !option || action.isPending}
        onClick={() => {
          if (!option) {
            return;
          }

          try {
            const startsAt = resolveTime(`${option.date}T${hour}`, zone, choice);
            setProblem('');
            action.mutate({
              kind: 'resolve',
              optionId: option.id,
              revision: poll.revision,
              startsAt,
            });
          } catch (error) {
            setProblem(pollError(error));
          }
        }}
      >
        Сохранить время
      </button>
      <button
        type="button"
        disabled={!option || action.isPending}
        onClick={() => {
          if (option) {
            setProblem('');
            action.mutate({
              kind: 'resolve',
              optionId: option.id,
              revision: poll.revision,
              startsAt: null,
            });
          }
        }}
      >
        Уточнить время позже
      </button>
      {(problem || action.error) && (
        <p role="alert" className={styles['error']}>
          {problem || pollError(action.error)}
        </p>
      )}
    </div>
  );
};
