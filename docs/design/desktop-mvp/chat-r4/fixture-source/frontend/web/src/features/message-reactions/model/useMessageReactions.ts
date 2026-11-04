import { useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useReactionAction } from '@/features/message-reactions/model/useReactionAction';
import { projectReaction } from '@/features/message-reactions/lib/projectReaction';

export const useMessageReactions = (
  id: string,
  entry: string,
  session: Session,
  reactions: Reaction[],
  change: (open: boolean) => void,
  anchor: RefObject<HTMLElement | null>,
) => {
  const action = useReactionAction(id, entry, session);
  const peopleTrigger = useRef<HTMLElement>(null);
  const [peopleFilter, setPeopleFilter] = useState('');
  const returnFocus = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    returnFocus.current = peopleTrigger.current?.isConnected
      ? peopleTrigger.current
      : anchor.current;
  });
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
    change(false);
  };

  const retry = () => {
    if (action.mutation.variables) {
      action.mutation.mutate(action.mutation.variables);
    }
  };

  return {
    ...action,
    displayed,
    choose,
    peopleTrigger,
    peopleFilter,
    setPeopleFilter,
    returnFocus,
    retry,
  };
};
