import { ApiError, errorText } from '@/shared/api';
import type { PlacePoll } from '@/entities/meeting';
import { timeLabel } from '@/shared/lib/time';

export const placePollStatus = (poll: PlacePoll, zone: string): string => {
  if (poll.state === 'applied') {
    return 'Место изменено';
  }

  if (poll.state === 'rejected') {
    return 'Место осталось прежним';
  }

  if (poll.state === 'cancelled') {
    return 'Опрос отменён: организатор изменил место';
  }

  return !poll.canVote || Date.parse(poll.closesAt) <= Date.now()
    ? 'Голосование завершено'
    : `До ${timeLabel(poll.closesAt, zone)}`;
};

export const placePollError = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.code === 'place_poll_active') {
      return 'Во встрече уже есть открытый опрос о месте.';
    }

    if (error.code === 'place_poll_closed') {
      return 'Голосование уже завершено.';
    }

    if (error.code === 'place_vote_revision_conflict') {
      return 'Ваш голос изменился на другом устройстве. Выберите ответ ещё раз.';
    }

    if (error.fields.place === 'unchanged') {
      return 'Предложите другое место.';
    }

    if (error.fields.place) {
      return 'Введите новое место: от 1 до 500 символов.';
    }

    if (error.fields.closes_at) {
      return 'Выберите время окончания позже текущего.';
    }

    return error.status >= 500
      ? 'Не удалось создать опрос. Попробуйте ещё раз.'
      : errorText(error);
  }

  return 'Не удалось создать опрос. Попробуйте ещё раз.';
};
