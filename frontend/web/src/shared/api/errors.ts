import { z } from 'zod';

const errorSchema = z.object({
  error: z.object({
    code: z.string(),
    field_errors: z.record(z.string(), z.string()),
    request_id: z.string(),
    current_response: z.unknown().optional(),
    current_meeting: z.unknown().optional(),
  }),
});

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    public fields: Record<string, string> = {},
  ) {
    super(code);
    this.name = 'ApiError';
  }
}

export const parseApiError = (status: number, value: unknown): ApiError => {
  const parsed = errorSchema.safeParse(value);

  return parsed.success
    ? new ApiError(status, parsed.data.error.code, parsed.data.error.field_errors)
    : new ApiError(status, 'invalid_response');
};

export const errorText = (error: unknown): string => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Сессия закончилась. Войдите снова.';
    }

    if (error.status === 403) {
      return 'Переписка недоступна с текущим ответом на приглашение.';
    }

    if (error.status === 404) {
      return 'Встреча или приглашение не найдены.';
    }

    if (error.code === 'join_closed') {
      return 'Участие закрыто за час до начала встречи.';
    }

    if (error.code === 'meeting_past') {
      return 'Встреча уже прошла. Присоединиться нельзя.';
    }

    if (error.status === 429) {
      return 'Слишком много запросов. Попробуйте немного позже.';
    }

    if (error.status === 409) {
      return 'Данные изменились. Проверьте актуальное состояние перед сохранением.';
    }

    if (error.status === 422) {
      return 'Проверьте заполненные поля.';
    }

    if (error.status === 503) {
      return 'Вход пока не настроен. Попробуйте позже.';
    }
  }

  return 'Не удалось получить ответ. Попробуйте ещё раз.';
};
