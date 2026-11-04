export const unreadLabel = (count: string) => {
  const value = BigInt(count);
  const last = value % 10n;
  const teen = value % 100n >= 11n && value % 100n <= 14n;
  const noun =
    !teen && last === 1n
      ? 'непрочитанное сообщение'
      : !teen && last >= 2n && last <= 4n
        ? 'непрочитанных сообщения'
        : 'непрочитанных сообщений';

  return `${count} ${noun}`;
};

export const unreadNotice = (count: string) => {
  const value = BigInt(count);
  const display = value > 99n ? '99+' : count;
  const singular = value <= 99n && value % 10n === 1n && value % 100n !== 11n;

  return `${display} ${singular ? 'непрочитанное' : 'непрочитанных'}`;
};
