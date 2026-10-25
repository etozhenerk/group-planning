import type { Reaction } from '@/entities/meeting';
import { Avatar } from '@/shared/ui/Avatar';
import styles from '@/features/message-reactions/ui/ReactionPeople/ReactionPeople.module.css';

export type ReactionPeopleProps = { reactions: Reaction[] };

export const ReactionPeople = ({ reactions }: ReactionPeopleProps) => (
  <ul className={styles.list}>
    {reactions.flatMap((reaction) =>
      reaction.users.map((user) => (
        <li key={`${reaction.emoji}:${user.id}`}>
          <Avatar name={user.display_name} src={user.avatar_url ?? null} size="small" />
          <span>{user.display_name}</span>
          <span>{reaction.emoji}</span>
        </li>
      )),
    )}
  </ul>
);
