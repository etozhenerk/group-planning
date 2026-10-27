import { useEffect, useRef } from 'react';
import { hashKey, useQueryClient } from '@tanstack/react-query';
import type { Session } from '@/entities/session';
import {
  accessEpoch,
  guarded,
  denyAccess,
  mergeEntries,
  privateKey,
  sendMessage,
} from '@/entities/meeting';
import type { Conversation } from '@/entities/meeting';
import { observePrivateStore, publishPrivateStore } from '@/shared/lib/private-store';
import type { PrivateScope } from '@/shared/lib/private-store';
import {
  createMessageQueue,
  matchingMessage,
} from '@/features/send-message/model/createMessageQueue';
import {
  readMessageDocument,
  updateMessageDocument,
} from '@/features/send-message/model/messageStore';
import type { PendingMessage } from '@/features/send-message/model/types';

export const useOutboxQueue = (
  id: string,
  session: Session,
  epoch: number,
  scope: PrivateScope | null,
  storageError: () => void,
) => {
  const client = useQueryClient();
  const queue = useRef<ReturnType<typeof createMessageQueue> | null>(null);
  const error = useRef(storageError);
  error.current = storageError;
  useEffect(() => {
    if (!scope) {
      return;
    }

    let disposed = false;
    let reading = false;
    let again = false;
    const awaiting = new Set<string>();
    const user = session.user.id;
    const key = privateKey(user, id, epoch, 'feed');
    const pendingKey = privateKey(user, id, epoch, 'pending-messages');
    const readyKey = privateKey(user, id, epoch, 'chat-ready');
    const current = () => !disposed && accessEpoch(user, id) === epoch;
    const refresh = async () => {
      if (reading) {
        again = true;

        return;
      }

      reading = true;

      try {
        do {
          again = false;
          const document = await readMessageDocument(scope);

          if (!current()) {
            return;
          }

          const entries = client.getQueryData<Conversation>(key)?.entries ?? [];

          for (const intent of client.getQueryData<PendingMessage[]>(pendingKey) ?? []) {
            if (entries.some((entry) => matchingMessage(entry, scope, intent))) {
              awaiting.delete(intent.id);
            }
          }

          const remaining = document.intents.filter(
            (intent) => !entries.some((entry) => matchingMessage(entry, scope, intent)),
          );

          if (remaining.length !== document.intents.length) {
            await updateMessageDocument(scope, (latest) => ({
              ...latest,
              intents: latest.intents.filter(
                (intent) =>
                  !entries.some((entry) => matchingMessage(entry, scope, intent)),
              ),
            }));
          }

          if (current()) {
            client.setQueryData<PendingMessage[]>(pendingKey, (previous) => [
              ...remaining.map<PendingMessage>((intent) => ({
                ...intent,
                delivery: intent.state,
                state:
                  intent.state === 'rejected' || intent.state === 'uncertain'
                    ? 'failed'
                    : 'sending',
              })),
              ...(previous ?? []).filter(
                (intent) =>
                  awaiting.has(intent.id) &&
                  !remaining.some((item) => item.id === intent.id) &&
                  !entries.some((entry) => matchingMessage(entry, scope, intent)),
              ),
            ]);
          }
        } while (again && current());
      } catch {
        if (current()) {
          error.current();
        }
      } finally {
        reading = false;
      }
    };

    const activate = () => {
      queue.current?.stop();
      queue.current = null;

      if (!current() || document.visibilityState !== 'visible' || !navigator.onLine) {
        return;
      }

      queue.current = createMessageQueue({
        scope,
        active: () =>
          current() &&
          client.getQueryData<boolean>(readyKey) === true &&
          document.visibilityState === 'visible' &&
          navigator.onLine,
        send: (intent, signal) =>
          guarded(client, user, id, epoch, () =>
            sendMessage(id, intent.text, intent.id, session.csrf, signal),
          ),
        accepted: (entry) => {
          if (current()) {
            client.setQueryData<Conversation>(key, (value) =>
              value
                ? { ...value, entries: mergeEntries(value.entries, [entry]) }
                : undefined,
            );

            if (entry.clientRequestId) {
              publishPrivateStore({
                kind: 'accepted',
                user,
                meeting: id,
                intent: entry.clientRequestId,
              });
            }
          }
        },
        changed: () => {
          void refresh();
        },
        denied: () => denyAccess(client, user, id, epoch),
        storageError: () => error.current(),
      });
      void queue.current.drain();
    };

    const unobserve = observePrivateStore((event) => {
      if (
        (!event.user || event.user === user) &&
        (!event.meeting || event.meeting === id)
      ) {
        if (event.kind === 'accepted' && event.intent) {
          awaiting.add(event.intent);
        }

        if (event.kind === 'purged') {
          disposed = true;
          queue.current?.stop();
          client.removeQueries({ queryKey: pendingKey });
        } else {
          void refresh();
          void queue.current?.drain();
        }
      }
    });

    const unsubscribe = client.getQueryCache().subscribe((event) => {
      if (event.query.queryHash === hashKey(readyKey)) {
        void queue.current?.drain();
      }

      if (event.query.queryHash === hashKey(key)) {
        void refresh();
      }
    });

    void refresh();
    activate();
    document.addEventListener('visibilitychange', activate);
    window.addEventListener('online', activate);
    window.addEventListener('offline', activate);

    return () => {
      disposed = true;
      queue.current?.stop();
      queue.current = null;
      unobserve();
      unsubscribe();
      document.removeEventListener('visibilitychange', activate);
      window.removeEventListener('online', activate);
      window.removeEventListener('offline', activate);
    };
  }, [client, id, session.user.id, session.csrf, epoch, scope]);

  return queue;
};
