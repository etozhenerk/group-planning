export type ConversationActionKind =
  'menu' | 'date' | 'place' | 'task' | 'photo' | 'file';

export const actionTitle = (kind: ConversationActionKind) =>
  ({
    menu: 'Добавить к встрече',
    date: 'Предложить дату',
    place: 'Предложить место',
    task: 'Предложить задачу',
    photo: 'Добавить фото',
    file: 'Добавить файл',
  })[kind];
