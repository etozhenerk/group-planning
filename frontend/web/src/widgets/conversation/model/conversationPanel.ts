export type ConversationPanel =
  'add' | 'emoji' | `reaction:${string}` | `people:${string}` | `readers:${string}`;

export const isConversationPanel = (value: unknown): value is ConversationPanel =>
  typeof value === 'string' &&
  (value === 'add' ||
    value === 'emoji' ||
    /^(reaction|people|readers):[a-zA-Z0-9-]+$/.test(value) ||
    /^reaction:outbox:[a-zA-Z0-9-]+$/.test(value));
