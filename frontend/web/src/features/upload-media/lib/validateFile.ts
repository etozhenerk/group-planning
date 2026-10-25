import type { MediaLimits } from '@/shared/api';

export const validateFile = (file: File, limits: MediaLimits, photo: boolean) => {
  if (!(photo ? limits.photo_types : limits.file_types).includes(file.type)) {
    return 'Этот формат не поддерживается.';
  }

  if (file.size > (photo ? limits.max_photo_bytes : limits.max_file_bytes)) {
    return `Файл больше ${Math.floor((photo ? limits.max_photo_bytes : limits.max_file_bytes) / 1024 / 1024)} МБ.`;
  }

  if (file.size === 0) {
    return 'Файл пустой.';
  }

  return '';
};
