import { loadChat } from '@/entities/meeting/model/loadChat';
import { useChatUpdates } from '@/entities/meeting/model/useChatUpdates';
import { shareConversation } from '@/entities/meeting/model/shareConversation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useWindowHistory } from '@/entities/meeting/model/useWindowHistory';
import { privateKey, useAccess } from '@/entities/meeting/model/access';
import type { FeedPosition } from '@/entities/meeting/model/feedWindow';
import type { Conversation } from '@/entities/meeting/model/types';

export const useConversation = (id: string, user: string) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const key = privateKey(user, id, access.epoch, 'feed');
  const [settledScope, setSettledScope] = useState('');
  const scope = `${user}:${id}:${access.epoch}`;
  const history = useWindowHistory(user, id, access.epoch);
  const positionKey = privateKey(user, id, access.epoch, 'feed-position');
  client.setQueryDefaults(positionKey, { gcTime: Infinity });
  const query = useQuery<Conversation>({
    queryKey: key,
    structuralSharing: (previous, incoming) =>
      shareConversation(
        previous,
        incoming,
        client.getQueryData<FeedPosition>(
          privateKey(user, id, access.epoch, 'feed-position'),
        ),
      ),
    enabled: !!user && !access.denied,
    retry: false,
    gcTime: 0,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    queryFn: ({ signal }) => loadChat(client, user, id, access.epoch, signal),
  });

  useEffect(() => {
    if (!query.isPending && !query.isFetching) {
      setSettledScope(scope);
    }
  }, [scope, query.isPending, query.isFetching]);
  useChatUpdates(
    user,
    id,
    access.epoch,
    !!user && !access.denied && settledScope === scope,
  );

  return {
    ...query,
    access,
    ...history,
    position: () => client.getQueryData<FeedPosition>(positionKey),
    clearNewMessages: () =>
      client.setQueryData<Conversation>(key, (latest) =>
        latest?.newMessages ? { ...latest, newMessages: 0 } : latest,
      ),
    savePosition: (position: FeedPosition) => client.setQueryData(positionKey, position),
  };
};
