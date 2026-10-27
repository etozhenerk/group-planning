import type { FeedEntry } from '@/entities/meeting';

export const feedKey = (entry: FeedEntry, user: string) =>
  entry.actor.id === user && entry.clientRequestId
    ? `${entry.actor.id}:${entry.clientRequestId}`
    : entry.id;

export const newMessagesLabel = (count: number) => {
  if (!count) {
    return 'К новым сообщениям';
  }

  const last = count % 10;
  const hundred = count % 100;

  return last === 1 && hundred !== 11
    ? `${count} новое сообщение`
    : last >= 2 && last <= 4 && (hundred < 12 || hundred > 14)
      ? `${count} новых сообщения`
      : `${count} новых сообщений`;
};
