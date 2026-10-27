export const outgoingError = (error: unknown) =>
  error instanceof Error && error.message === 'draft_not_empty'
    ? 'Сначала сохраните или отправьте новый текст'
    : 'Не удалось сохранить сообщение на устройстве';
