import { projectReaction } from '@/features/message-reactions/lib/projectReaction';
import { useState } from 'react';
import type { Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useReactionAction } from '@/features/message-reactions/model/useReactionAction';
import { ReactionPopover } from '@/features/message-reactions/ui/ReactionPopover';
import { Dialog } from '@/shared/ui/Dialog';
import { ReactionPeople } from '@/features/message-reactions/ui/ReactionPeople';
import styles from '@/features/message-reactions/ui/MessageReactions/MessageReactions.module.css';

export type MessageReactionsProps = {
  id: string;
  entry: string;
  session: Session;
  reactions: Reaction[];
};

export const MessageReactions = ({
  id,
  entry,
  session,
  reactions,
}: MessageReactionsProps) => {
  const action = useReactionAction(id, entry, session);
  const [people, setPeople] = useState(false);
  const displayed =
    action.mutation.isPending && action.mutation.variables
      ? projectReaction(reactions, action.mutation.variables, session)
      : reactions;

  const choose = (emoji: string) => {
    if (action.mutation.isPending) {
      return;
    }

    action.mutation.mutate({
      emoji,
      active: !reactions.find((value) => value.emoji === emoji)?.mine,
    });
    action.setPicker(false);
  };

  if (action.denied) {
    return null;
  }

  return (
    <div className={styles.reactions} data-empty={displayed.length === 0}>
      {displayed.map((reaction) => (
        <button
          key={reaction.emoji}
          type="button"
          aria-label={`${reaction.emoji}: ${reaction.count}`}
          aria-pressed={reaction.mine}
          disabled={action.mutation.isPending}
          onClick={() => choose(reaction.emoji)}
        >
          {reaction.emoji} {reaction.count}
        </button>
      ))}
      <ReactionPopover
        open={action.picker}
        change={action.setPicker}
        choose={choose}
        pending={action.mutation.isPending}
        {...(reactions.length > 0
          ? {
              people: () => {
                action.setPicker(false);
                setPeople(true);
              },
            }
          : {})}
      />
      {action.mutation.error && (
        <button
          type="button"
          className={styles.error}
          onClick={() => {
            if (action.mutation.variables) {
              action.mutation.mutate(action.mutation.variables);
            }
          }}
        >
          Не удалось сохранить. Повторить
        </button>
      )}
      <Dialog open={people} title="Реакции" onClose={() => setPeople(false)}>
        <ReactionPeople reactions={reactions} />
      </Dialog>
    </div>
  );
};
