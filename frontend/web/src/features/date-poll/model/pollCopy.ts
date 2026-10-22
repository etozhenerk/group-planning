import type { DatePoll } from '@/entities/meeting';
import { ApiError, errorText } from '@/shared/api';
import { timeLabel } from '@/shared/lib/time';

export const voteLabel = (count: number): string => {
  const last = count % 10;
  const word =
    count % 100 >= 11 && count % 100 <= 14
      ? 'голосов'
      : last === 1
        ? 'голос'
        : last >= 2 && last <= 4
          ? 'голоса'
          : 'голосов';

  return `${count} ${word}`;
};

export const pollStatus = (poll: DatePoll, zone: string): string => {
  const states = {
    applied: 'Опрос завершён · дата выбрана',
    no_majority: 'Опрос завершён · без большинства',
    cancelled: 'Опрос завершён',
    awaiting_choice: 'Выбор за организатором',
    awaiting_time: 'Нужно уточнить время',
  };

  if (poll.state !== 'open') {
    return states[poll.state];
  }

  return poll.canVote || poll.canAddOptions
    ? `До ${timeLabel(poll.closesAt, zone)}`
    : Date.parse(poll.closesAt) <= Date.now()
      ? 'Подводим итог…'
      : `До ${timeLabel(poll.closesAt, zone)}`;
};

export const pollError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code === 'date_poll_active') {
      return 'В этой встрече уже есть незавершённый опрос даты.';
    }

    if (error.code === 'date_poll_closed') {
      return 'Опрос уже завершён. Можно создать новый.';
    }

    if (error.fields.date === 'duplicate') {
      return 'Такая дата уже есть в опросе.';
    }

    if (error.fields.closes_at) {
      return 'Опрос должен закончиться позже текущего времени.';
    }
  }

  return error instanceof Error && !(error instanceof ApiError)
    ? error.message
    : errorText(error);
};
