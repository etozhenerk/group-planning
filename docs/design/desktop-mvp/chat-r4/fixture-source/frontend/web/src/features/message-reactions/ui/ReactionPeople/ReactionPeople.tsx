import type { Reaction } from '@/entities/meeting';
import { useState } from 'react';
import { useMobileLayout } from '@/shared/lib/media';
import { reactionPeople } from '@/features/message-reactions/lib/reactionPeople';
import { Avatar } from '@/shared/ui/Avatar';
import styles from '@/features/message-reactions/ui/ReactionPeople/ReactionPeople.module.css';

export type ReactionPeopleProps = { reactions: Reaction[]; initialFilter?: string };

export const ReactionPeople = ({
  reactions,
  initialFilter = '',
}: ReactionPeopleProps) => {
  const [filter, setFilter] = useState(initialFilter);
  const mobile = useMobileLayout();
  const selected = reactions.some((reaction) => reaction.emoji === filter) ? filter : '';
  const people = reactionPeople(reactions, selected);

  return (
    <div>
      <div className={styles.filters} role="group" aria-label="Фильтр реакций">
        <button
          type="button"
          aria-pressed={!selected}
          onClick={(event) => {
            event.currentTarget.focus({ preventScroll: true });
            setFilter('');
          }}
        >
          Все
        </button>
        {reactions.map((reaction) => (
          <button
            key={reaction.emoji}
            type="button"
            aria-pressed={selected === reaction.emoji}
            aria-label={`Реакция ${reaction.emoji}`}
            onClick={(event) => {
              event.currentTarget.focus({ preventScroll: true });
              setFilter(reaction.emoji);
            }}
          >
            {reaction.emoji} {reaction.count}
          </button>
        ))}
      </div>
      <ul className={styles.list} data-mobile={mobile}>
        {people.map(({ user, emojis }) => (
          <li key={user.id}>
            <Avatar name={user.display_name} src={user.avatar_url ?? null} size="small" />
            <span>{user.display_name}</span>
            <span className={styles.emojis}>{emojis.join(' ')}</span>
          </li>
        ))}
      </ul>
      {!people.length && <p role="status">Реакций пока нет</p>}
    </div>
  );
};
