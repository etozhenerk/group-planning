import type { Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';

export const projectReaction = (
  reactions: Reaction[],
  change: { emoji: string; active: boolean },
  session: Session,
): Reaction[] => {
  const existing = reactions.find((value) => value.emoji === change.emoji);

  if (existing?.mine === change.active) {
    return reactions;
  }

  const users = (existing?.users ?? []).filter((user) => user.id !== session.user.id);

  if (change.active) {
    users.push({ id: session.user.id, display_name: session.user.displayName });
  }

  const count = Math.max(0, (existing?.count ?? 0) + (change.active ? 1 : -1));
  const updated = { emoji: change.emoji, mine: change.active, count, users };

  return [
    ...reactions.filter((value) => value.emoji !== change.emoji),
    ...(count ? [updated] : []),
  ];
};
