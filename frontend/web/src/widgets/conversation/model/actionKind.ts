export type ConversationActionKind =
  'menu' | 'date' | 'place' | 'task' | 'photo' | 'file' | 'share';

export const actionTitle = (kind: ConversationActionKind) =>
  ({
    menu: 'Добавить к встрече',
    date: 'Новая дата встречи',
    place: 'Предложить место',
    task: 'Предложить задачу',
    photo: 'Отправить фото',
    file: 'Отправить файл',
    share: 'Пригласить друзей',
  })[kind];
