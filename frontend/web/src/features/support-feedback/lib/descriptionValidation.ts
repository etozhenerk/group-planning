export const trimDescription = (value: string): string =>
  value.replace(/^\p{White_Space}+|\p{White_Space}+$/gu, '');

export const descriptionProblem = (value: string): string => {
  const length = Array.from(trimDescription(value)).length;

  if (length < 10) {
    return 'Добавьте описание — хотя бы 10 символов.';
  }

  if (length > 3000) {
    return 'Сократите сообщение до 3000 символов.';
  }

  return '';
};
