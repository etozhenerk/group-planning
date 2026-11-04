import { dayLabel } from '@/shared/lib/time/plainDate';
import { Temporal } from '@js-temporal/polyfill';

export type TimeChoice = 'earlier' | 'later' | '';

export const resolveTime = (
  local: string,
  zone: string,
  choice: TimeChoice = '',
): string => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?$/.test(local)) {
    throw new Error('Выберите дату и укажите время встречи.');
  }

  let plain: Temporal.PlainDateTime;

  try {
    plain = Temporal.PlainDateTime.from(local, { overflow: 'reject' });
  } catch {
    throw new Error('Проверьте дату и время встречи.');
  }

  const earlier = plain.toZonedDateTime(zone, { disambiguation: 'earlier' });
  const later = plain.toZonedDateTime(zone, { disambiguation: 'later' });

  if (
    !earlier.toPlainDateTime().equals(plain) ||
    !later.toPlainDateTime().equals(plain)
  ) {
    throw new Error(
      'В выбранном часовом поясе этого времени нет. Выберите другое время.',
    );
  }

  if (earlier.epochNanoseconds !== later.epochNanoseconds && !choice) {
    throw new Error('Это время встречается дважды. Выберите ранний или поздний вариант.');
  }

  return (choice === 'later' ? later : earlier).toString({
    timeZoneName: 'never',
    calendarName: 'never',
    smallestUnit: 'second',
  });
};

export const editLocalTime = (stamp: string | null, zone: string): string => {
  if (!stamp) {
    return '';
  }

  return Temporal.Instant.from(stamp)
    .toZonedDateTimeISO(zone)
    .toPlainDateTime()
    .toString({ smallestUnit: 'minute' });
};

export const timeLabel = (
  stamp: string | null,
  zone: string,
  day?: string | null,
): string => {
  if (!stamp) {
    return day ? `${dayLabel(day)} · время пока не выбрано` : 'Дата ещё не выбрана';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    timeZone: zone,
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(stamp));
};

export const clockLabel = (stamp: string): string => {
  return new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' }).format(
    new Date(stamp),
  );
};
