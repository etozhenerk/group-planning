import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, request, reportUnauthorized, sessionSchema } from '@/shared/api';
import { createRealtime } from '@/shared/lib/realtime';
import { observePrivateStore } from '@/shared/lib/private-store';
import { createChatUpdates } from '@/entities/meeting/model/createChatUpdates';
import { getChatCapabilities } from '@/entities/meeting/api/chat';

export const useMeetingListUpdates = (user: string) => {
  const client = useQueryClient();
  const flags = useQuery({
    queryKey: ['chat-capabilities', user, 'list'],
    queryFn: ({ signal }) => getChatCapabilities(signal),
    enabled: !!user,
    staleTime: 30000,
    retry: false,
  });

  const enabled = flags.data?.sync && flags.data.read_state;
  const realtime = !!flags.data?.realtime;
  useEffect(() => {
    if (!enabled) {
      return;
    }

    let stop: (() => void) | undefined;
    const activate = () => {
      stop?.();
      stop = undefined;

      if (document.visibilityState !== 'visible' || !navigator.onLine) {
        return;
      }

      const controller = new AbortController();
      const authenticate = async () => {
        const session = await request(sessionSchema, '/me', {
          signal: controller.signal,
        });

        if (session.user.id !== user) {
          reportUnauthorized();
          throw new ApiError(401, 'session_changed');
        }

        controller.signal.throwIfAborted();
      };

      const terminal = (error: unknown) =>
        controller.signal.aborted ||
        (error instanceof ApiError && [400, 401, 403, 404].includes(error.status));

      const updates = createChatUpdates({
        realtime,
        authenticate,
        terminal,
        refresh: async () => {
          controller.signal.throwIfAborted();
          await client.refetchQueries(
            { queryKey: ['meetings', user], type: 'active' },
            { cancelRefetch: false, throwOnError: true },
          );
        },
        connect: (events) =>
          createRealtime({
            ...events,
            url: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/v1/realtime`,
            personal: events.hint,
            authenticate: async () => {
              try {
                await authenticate();
              } catch (error) {
                if (terminal(error)) {
                  updates.stop();
                }

                throw error;
              }
            },
            denied: () => {
              updates.stop();
              reportUnauthorized();
            },
          }),
      });

      stop = () => {
        controller.abort();
        updates.stop();
      };
    };

    const hide = () => stop?.();
    const unobserve = observePrivateStore((event) => {
      if (
        event.kind === 'purged' &&
        (!event.user || event.user === user) &&
        !event.meeting
      ) {
        stop?.();
      }
    });

    activate();
    document.addEventListener('visibilitychange', activate);
    window.addEventListener('pageshow', activate);
    window.addEventListener('pagehide', hide);
    window.addEventListener('online', activate);
    window.addEventListener('offline', hide);

    return () => {
      stop?.();
      unobserve();
      document.removeEventListener('visibilitychange', activate);
      window.removeEventListener('pageshow', activate);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('online', activate);
      window.removeEventListener('offline', hide);
    };
  }, [client, user, enabled, realtime]);
};
