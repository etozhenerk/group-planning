import type { PreparationTask, PreparationAction } from '@/entities/meeting';
import { ApiError } from '@/shared/api';

export const taskStatus = (task: PreparationTask, user: string) => {
  switch (task.state) {
    case 'offered':
      return task.recipient
        ? task.recipient.id === user
          ? 'Предложено вам'
          : `Кому предложено: ${task.recipient.displayName}`
        : 'Пока никто не взял задачу';
    case 'accepted':
      return `Исполняет ${task.assignee?.displayName ?? 'участник'}`;
    case 'completed':
      return `Выполнено · ${task.updatedBy.displayName}`;
    case 'declined':
      return `Отказ · ${task.updatedBy.displayName}`;
    case 'cancelled':
      return `Отменено · ${task.updatedBy.displayName}`;
  }
};

export const taskActions = (
  task: PreparationTask,
): { action: PreparationAction; label: string }[] => {
  const result: { action: PreparationAction; label: string }[] = [];

  if (task.canAccept) {
    result.push({
      action: 'accept',
      label: task.recipient ? 'Принять задачу' : 'Взять на себя',
    });
  }

  if (task.canComplete) {
    result.push({ action: 'complete', label: 'Отметить выполнение' });
  }

  if (task.canDecline) {
    result.push({ action: 'decline', label: 'Отказаться' });
  }

  if (task.canCancel) {
    result.push({ action: 'cancel', label: 'Отменить задачу' });
  }

  return result;
};

export const taskError = (error: unknown, creating = false) => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'Задача изменилась. Проверьте её состояние.';
    }

    if (error.status === 422) {
      return 'Проверьте название и выберите участника из списка.';
    }
  }

  return creating
    ? 'Не удалось предложить задачу. Повторите отправку.'
    : 'Не удалось сохранить действие.';
};

export const uncertainTaskError = (error: unknown) =>
  !!error && !(error instanceof ApiError && error.status >= 400 && error.status < 500);

export const taskStateLabel = (task: PreparationTask) => {
  switch (task.state) {
    case 'offered':
      return 'Предложена';
    case 'accepted':
      return 'Принята';
    case 'completed':
      return 'Выполнена';
    case 'declined':
      return 'Отклонена';
    case 'cancelled':
      return 'Отменена';
  }
};
