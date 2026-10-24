export type ConversationActionKind = 'menu' | 'date' | 'place' | 'task';

export const actionTitle = (kind: ConversationActionKind) =>
  ({
    menu: 'Добавить к встрече',
    date: 'Новая дата встречи',
    place: 'Предложить место',
    task: 'Предложить задачу',
  })[kind];
