import { useCallback, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getChatCapabilities } from '@/entities/meeting/api/chat';
import { putChatReadMarker } from '@/entities/meeting/api/readState';
import { createReadMarker } from '@/entities/meeting/model/createReadMarker';
import { markerReadState } from '@/entities/meeting/model/readProjection';
import {
  accessEpoch,
  guarded,
  privateKey,
  useAccess,
} from '@/entities/meeting/model/access';
import type { ChatReadState } from '@/entities/meeting/model/readProjection';
import type { ReadVisibility } from '@/entities/meeting/model/readMarkerTypes';
import type { Conversation } from '@/entities/meeting/model/types';

export const useChatRead = (
  id: string,
  user: string,
  csrf: string | null,
  read: ChatReadState | undefined,
) => {
  const client = useQueryClient();
  const access = useAccess(user, id);
  const stream = client.getQueryData<Conversation>(
    privateKey(user, id, access.epoch, 'feed'),
  )?.sync?.streamEpoch;

  const capabilities = useQuery({
    queryKey: ['chat-capabilities', user, access.epoch],
    queryFn: ({ signal }) => getChatCapabilities(signal),
    staleTime: 30000,
    enabled: !!user,
    retry: false,
  });

  const enabled =
    capabilities.data?.read_state === true &&
    capabilities.data.sync &&
    !access.denied &&
    !!read;

  const active = useRef(enabled);
  active.current = enabled;
  const owner = useRef<ReturnType<typeof createReadMarker> | undefined>(undefined);
  const current = useRef(read);
  current.current = read;
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const epoch = access.epoch;
    const key = privateKey(user, id, epoch, 'feed');
    const marker = createReadMarker({
      initialSequence: current.current?.through ?? '0',
      send: (sequence, signal, keepalive) =>
        guarded(client, user, id, epoch, () =>
          putChatReadMarker(id, sequence, csrf, signal, keepalive),
        ),
      onConfirmed: (result) => {
        if (accessEpoch(user, id) !== epoch) {
          return;
        }

        client.setQueryData<Conversation>(key, (previous) =>
          previous
            ? { ...previous, read: markerReadState(result, previous.read) }
            : undefined,
        );
        void client.invalidateQueries({ queryKey: ['meetings', user] });
      },
    });

    owner.current = marker;
    const flush = () => void marker.flush();
    window.addEventListener('pagehide', flush);

    return () => {
      window.removeEventListener('pagehide', flush);

      if (
        active.current &&
        accessEpoch(user, id) === epoch &&
        client.getQueryData<Conversation>(key)?.sync?.streamEpoch === stream
      ) {
        void marker.flush();
      }

      marker.dispose();

      if (owner.current === marker) {
        owner.current = undefined;
      }
    };
  }, [client, id, user, csrf, access.epoch, enabled, stream]);
  useEffect(() => {
    if (read) {
      owner.current?.confirm(read.through);
    }
  }, [read]);
  const setVisibility = useCallback(
    (visibility: ReadVisibility) => owner.current?.setVisibility(visibility),
    [],
  );

  return { enabled, setVisibility };
};
