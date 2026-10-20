export const authNotice = (code: string | null): string | null => {
  if (code === 'cancelled') {
    return 'Вход отменён. Вы можете попробовать ещё раз.';
  }

  if (code === 'unavailable') {
    return 'Не удалось завершить вход. Попробуйте ещё раз.';
  }

  return null;
};
