import { validDay } from '@/shared/lib/time/plainDate';
import { resolveTime } from '@/shared/lib/time/resolveTime';

export const resolveSchedule = (
  local: string,
  zone: string,
  choice: '' | 'earlier' | 'later' = '',
) => {
  const [day = '', hour = ''] = local.split('T');

  if (!validDay(day)) {
    throw new Error('Выберите дату встречи.');
  }

  return { starts_on: day, starts_at: hour ? resolveTime(local, zone, choice) : null };
};
