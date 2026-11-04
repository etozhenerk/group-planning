import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, request, sessionSchema, reportUnauthorized } from '@/shared/api';
import { observePrivateStore } from '@/shared/lib/private-store';
import { createRealtime } from '@/shared/lib/realtime';
import { accessEpoch, denyAccess, privateKey } from '@/entities/meeting/model/access';
import { createChatUpdates } from '@/entities/meeting/model/createChatUpdates';
import type { ChatCapabilities } from '@/entities/meeting/model/chatSchema';

export const useChatUpdates = (
  user: string,
  id: string,
  epoch: number,
  enabled: boolean,
) => {
  const client = useQueryClient();
  useEffect(() => {
    if (!enabled) {
      return;
    }

    const key = privateKey(user, id, epoch, 'feed');
    const readyKey = privateKey(user, id, epoch, 'chat-ready');
    let stop: (() => void) | undefined;
    const activate = () => {
      stop?.();
      stop = undefined;
      client.setQueryData(readyKey, false);

      if (
        document.visibilityState !== 'visible' ||
        !navigator.onLine ||
        accessEpoch(user, id) !== epoch
      ) {
        void client.cancelQueries({ queryKey: key });

        return;
      }

      const controller = new AbortController();
      const terminal = (error: unknown) => {
        if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
          denyAccess(client, user, id, epoch);

          return true;
        }

        return (
          (error instanceof ApiError && error.status === 400) ||
          controller.signal.aborted ||
          accessEpoch(user, id) !== epoch
        );
      };

      const authenticate = async () => {
        const session = await request(sessionSchema, '/me', {
          signal: controller.signal,
        });

        if (session.user.id !== user) {
          reportUnauthorized();
          throw new ApiError(401, 'session_changed');
        }

        if (accessEpoch(user, id) !== epoch) {
          throw new DOMException('Stale access', 'AbortError');
        }
      };

      const capabilities = client.getQueryData<ChatCapabilities>([
        'chat-capabilities',
        user,
        epoch,
      ]);

      const updates = createChatUpdates({
        realtime: !!capabilities?.sync && capabilities.realtime,
        authenticate,
        terminal,
        refresh: async () => {
          await client.refetchQueries(
            { queryKey: key, exact: true },
            { cancelRefetch: false, throwOnError: true },
          );

          if (!controller.signal.aborted && accessEpoch(user, id) === epoch) {
            client.setQueryData(readyKey, true);
          }
        },
        connect: (events) =>
          createRealtime({
            ...events,
            meeting: id,
            url: `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/api/v1/realtime`,
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
              denyAccess(client, user, id, epoch);
              updates.stop();
            },
            personal: () => {
              updates.hint();
              void client.invalidateQueries({ queryKey: ['meetings', user] });
            },
          }),
      });

      const unobserveAccepted = observePrivateStore((event) => {
        if (event.kind === 'accepted' && event.user === user && event.meeting === id) {
          updates.hint();
        }
      });

      stop = () => {
        unobserveAccepted();
        controller.abort();
        updates.stop();
      };
    };

    const unobserve = observePrivateStore((event) => {
      if (
        event.kind === 'purged' &&
        (!event.user || event.user === user) &&
        (!event.meeting || event.meeting === id)
      ) {
        stop?.();
        void client.cancelQueries({ queryKey: key });

        if (event.meeting) {
          denyAccess(client, user, id, epoch, false);
        }
      }
    });

    activate();
    document.addEventListener('visibilitychange', activate);
    window.addEventListener('online', activate);
    window.addEventListener('offline', activate);
    window.addEventListener('pageshow', activate);
    const hide = () => {
      stop?.();
      void client.cancelQueries({ queryKey: key });
    };

    window.addEventListener('pagehide', hide);

    return () => {
      stop?.();
      unobserve();
      document.removeEventListener('visibilitychange', activate);
      window.removeEventListener('online', activate);
      window.removeEventListener('offline', activate);
      window.removeEventListener('pageshow', activate);
      window.removeEventListener('pagehide', hide);
      void client.cancelQueries({ queryKey: key });
    };
  }, [client, user, id, epoch, enabled]);
};
