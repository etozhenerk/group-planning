import { ApiError } from '@/shared/api';

export const uploadProblem = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 403) {
      return 'Доступ к встрече закрыт.';
    }

    if (error.status === 401) {
      return 'Войдите снова, чтобы продолжить.';
    }

    if (error.fields['content'] === 'invalid_image') {
      return 'Не удалось прочитать изображение. Выберите другое фото.';
    }

    if (error.status === 413) {
      return 'Файл превышает допустимый размер.';
    }

    if (error.status === 422) {
      return 'Файл не прошёл проверку. Выберите другой файл.';
    }
  }

  return 'Не удалось загрузить файл. Повторите попытку.';
};
