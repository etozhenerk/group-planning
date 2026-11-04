import type { Reaction } from '@/entities/meeting';

export const reactionPeople = (reactions: Reaction[], filter: string) => {
  const people = new Map<string, { user: Reaction['users'][number]; emojis: string[] }>();

  for (const reaction of reactions) {
    if (filter && reaction.emoji !== filter) {
      continue;
    }

    for (const user of reaction.users) {
      const person = people.get(user.id) ?? { user, emojis: [] };
      person.emojis.push(reaction.emoji);
      people.set(user.id, person);
    }
  }

  return [...people.values()];
};
