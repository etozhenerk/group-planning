import { validDay } from '@/shared/lib/time';

export const pollDateErrors = (dates: string[]) =>
  dates.map((day, index) => {
    if (!validDay(day)) {
      return 'Выберите дату.';
    }

    return dates.indexOf(day) < index ? 'Эта дата уже есть в опросе.' : '';
  });
