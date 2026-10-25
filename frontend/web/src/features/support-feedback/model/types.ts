export type FeedbackKind = 'problem' | 'idea' | 'question';

export type Screenshot = { file_name: string; content_type: string; data_base64: string };

export const screenOptions = {
  meetings: 'Список встреч',
  calendar: 'Календарь',
  invitation: 'Приглашение',
  meeting_chat: 'Чат встречи',
  profile: 'Профиль',
  memories: 'Вайб встречи',
  sign_in: 'Вход',
  other: 'Другой экран',
};

export type FeedbackScreen = keyof typeof screenOptions;
