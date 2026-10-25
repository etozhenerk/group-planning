export const birthdayLabel = (value: string | null): string => {
  const parts = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '');

  if (!parts) {
    return 'Не указано';
  }

  const year = Number(parts[1]);
  const month = Number(parts[2]);
  const day = Number(parts[3]);

  if ((!year && !month && !day) || month > 12 || day > 31) {
    return 'Не указано';
  }

  if (month && day && new Date(Date.UTC(year || 2000, month, 0)).getUTCDate() < day) {
    return 'Не указано';
  }

  const date = new Date(Date.UTC(2000, (month || 1) - 1, day || 1));
  const monthName = month
    ? new Intl.DateTimeFormat('ru-RU', {
        month: 'long',
        timeZone: 'UTC',
        ...(day ? { day: 'numeric' } : {}),
      }).format(date)
    : '';

  if (monthName) {
    return `${monthName}${year ? ` ${year}` : ''}`;
  }

  if (day) {
    return `${day} число${year ? `, ${year}` : ''}`;
  }

  return String(year);
};

export const sexLabel = (value: string | null) =>
  value === 'male' ? 'Мужской' : value === 'female' ? 'Женский' : 'Не указано';
