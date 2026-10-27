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
