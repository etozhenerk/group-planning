import type { Screenshot } from '@/features/support-feedback/model/types';

export const readScreenshot = async (file: File): Promise<Screenshot> => {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    throw new Error('Выберите PNG, JPEG или WebP.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Скриншот должен быть не больше 5 МБ.');
  }

  if (!file.size) {
    throw new Error('Файл пустой.');
  }

  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      typeof reader.result === 'string'
        ? resolve(reader.result)
        : reject(new Error('Не удалось прочитать файл.'));
    reader.onerror = () => reject(new Error('Не удалось прочитать файл.'));
    reader.readAsDataURL(file);
  });

  return {
    file_name: file.name,
    content_type: file.type,
    data_base64: data.slice(data.indexOf(',') + 1),
  };
};
