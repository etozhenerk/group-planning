import type { RefObject } from 'react';
import type { Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useMessageReactions } from '@/features/message-reactions/model/useMessageReactions';
import { ReactionPopover } from '@/features/message-reactions/ui/ReactionPopover';
import { Dialog } from '@/shared/ui/Dialog';
import { ReactionPeople } from '@/features/message-reactions/ui/ReactionPeople';
import styles from '@/features/message-reactions/ui/MessageReactions/MessageReactions.module.css';
import { ReactionRetry } from '@/features/message-reactions/ui/ReactionRetry';
import { ReactionChip } from '@/features/message-reactions/ui/ReactionChip';

export type MessageReactionsProps = {
  id: string;
  entry: string;
  session: Session;
  reactions: Reaction[];
  open: boolean;
  change: (open: boolean) => void;
  anchor: RefObject<HTMLElement | null>;
  boundary: RefObject<HTMLElement | null>;
  context: string;
  readers?: (() => void) | undefined;
  people: { open: boolean; show: () => void; close: () => void };
};

export const MessageReactions = ({
  id,
  entry,
  session,
  reactions,
  open,
  change,
  anchor,
  boundary,
  context,
  people,
  readers,
}: MessageReactionsProps) => {
  const action = useMessageReactions(id, entry, session, reactions, change, anchor);

  if (action.denied) {
    return null;
  }

  return (
    <div className={styles.reactions} data-empty={action.displayed.length === 0}>
      {action.displayed.map((reaction) => (
        <ReactionChip
          key={reaction.emoji}
          reaction={reaction}
          pending={action.mutation.isPending}
          choose={action.choose}
          people={(emoji, trigger) => {
            action.peopleTrigger.current = trigger;
            action.setPeopleFilter(emoji);
            people.show();
          }}
        />
      ))}
      <ReactionPopover
        readers={readers}
        open={open}
        change={change}
        choose={action.choose}
        pending={action.mutation.isPending}
        anchor={anchor}
        boundary={boundary}
        context={context}
        selected={action.displayed
          .filter((value) => value.mine)
          .map((value) => value.emoji)}
      />
      {action.mutation.error && (
        <ReactionRetry retry={action.retry} pending={action.mutation.isPending} />
      )}
      <Dialog
        open={people.open}
        title="Кто отреагировал"
        onClose={people.close}
        chatAction
        returnFocus={action.returnFocus}
      >
        <ReactionPeople
          key={`${people.open}:${action.peopleFilter}`}
          reactions={reactions}
          initialFilter={action.peopleFilter}
        />
      </Dialog>
    </div>
  );
};
