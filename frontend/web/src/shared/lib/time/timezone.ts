export const browserTimezone = (): string => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
};

export const timezoneLabel = (timezone: string): string => {
  return (
    new Intl.DateTimeFormat('ru-RU', { timeZone: timezone, timeZoneName: 'longGeneric' })
      .formatToParts(new Date())
      .find((part) => part.type === 'timeZoneName')
      ?.value?.replace(/, (стандартное|летнее) время$/, '') ?? timezone
  );
};
