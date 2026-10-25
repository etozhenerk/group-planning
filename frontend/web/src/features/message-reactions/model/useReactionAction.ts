import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { guarded, setReaction, useAccess } from '@/entities/meeting';
import type { Reaction } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';

export const useReactionAction = (id: string, entry: string, session: Session) => {
  const client = useQueryClient();
  const access = useAccess(session.user.id, id);
  const intent = useIntent();
  const [picker, setPicker] = useState(false);
  const mutation = useMutation({
    mutationFn: (value: { emoji: string; active: boolean }) =>
      guarded(client, session.user.id, id, access.epoch, () =>
        setReaction(id, entry, value.emoji, value.active, session.csrf, intent(value)),
      ),
    onSuccess: (result) => {
      client.setQueriesData<{ entry_id: string; reactions: Reaction[] }[]>(
        { queryKey: ['private', session.user.id, id, access.epoch, 'reactions'] },
        (previous) => previous?.map((item) => (item.entry_id === entry ? result : item)),
      );
      void client.invalidateQueries({
        queryKey: ['private', session.user.id, id, access.epoch, 'reactions'],
      });
    },
    retry: false,
  });

  return { picker, setPicker, mutation, denied: access.denied };
};
