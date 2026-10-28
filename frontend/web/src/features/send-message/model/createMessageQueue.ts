import { ApiError } from '@/shared/api';
import { claimPrivateScope, withPrivateScopeLock } from '@/shared/lib/private-store';
import type { PrivateScope } from '@/shared/lib/private-store';
import {
  readMessageDocument,
  updateMessageDocument,
} from '@/features/send-message/model/messageStore';
import type { MessageIntent } from '@/features/send-message/model/messageStore';
import type { FeedEntry } from '@/entities/meeting';

type Options = {
  scope: PrivateScope;
  active: () => boolean;
  send: (intent: MessageIntent, signal: AbortSignal) => Promise<FeedEntry>;
  accepted: (entry: FeedEntry) => void;
  changed: () => void;
  denied: () => void;
  storageError: () => void;
};

export const matchingMessage = (
  entry: FeedEntry,
  scope: Pick<PrivateScope, 'user' | 'meeting'>,
  intent: Pick<MessageIntent, 'id' | 'text'>,
) =>
  entry.actor.id === scope.user &&
  entry.meetingId === scope.meeting &&
  entry.clientRequestId === intent.id &&
  entry.text === intent.text &&
  entry.kind === 'message' &&
  !entry.attachments?.length;

export const createMessageQueue = (options: Options) => {
  const owner = crypto.randomUUID();
  let running = false;
  let dirty = false;
  let stopped = false;
  let attempt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let controller: AbortController | undefined;
  const active = () => !stopped && options.active();
  const update = async (
    intent: MessageIntent,
    state: MessageIntent['state'] | 'accepted',
  ) => {
    if (!active()) {
      return;
    }

    await updateMessageDocument(options.scope, (current) => ({
      ...current,
      intents:
        state === 'accepted'
          ? current.intents.filter((item) => item.id !== intent.id)
          : current.intents.map((item) =>
              item.id === intent.id ? { ...item, state } : item,
            ),
    }));
    options.changed();
  };

  const schedule = () => {
    if (!active() || timer !== undefined) {
      return;
    }

    timer = setTimeout(
      () => {
        timer = undefined;
        void drain();
      },
      Math.min(30_000, 3_000 * 2 ** Math.min(attempt++, 4)),
    );
  };

  const drain = async () => {
    if (!active()) {
      return;
    }

    if (running) {
      dirty = true;

      return;
    }

    dirty = false;

    running = true;

    try {
      const current = await readMessageDocument(options.scope);

      if (!active() || !current.intents.some((item) => item.state !== 'rejected')) {
        return;
      }

      const locked = await withPrivateScopeLock(options.scope, async (browserOwned) => {
        try {
          while (active()) {
            const document = await readMessageDocument(options.scope);
            const intent = document.intents.find((item) => item.state !== 'rejected');

            if (!intent || !active()) {
              break;
            }

            if (!(await claimPrivateScope(options.scope, owner, false, browserOwned))) {
              schedule();
              break;
            }

            await update(intent, 'sending');

            if (!active()) {
              break;
            }

            controller = new AbortController();

            try {
              const entry = await options.send(
                intent,
                AbortSignal.any([controller.signal, AbortSignal.timeout(15_000)]),
              );

              if (!active()) {
                break;
              }

              if (!matchingMessage(entry, options.scope, intent)) {
                throw new ApiError(502, 'invalid_ack');
              }

              options.accepted(entry);
              await update(intent, 'accepted');
              attempt = 0;
            } catch (error) {
              if (!active()) {
                break;
              }

              if (error instanceof ApiError && [401, 403, 404].includes(error.status)) {
                stopped = true;
                options.denied();
                break;
              }

              const rejected =
                error instanceof ApiError && [400, 409, 422].includes(error.status);

              await update(intent, rejected ? 'rejected' : 'uncertain');

              if (!rejected) {
                schedule();
                break;
              }
            }
          }
        } finally {
          await claimPrivateScope(options.scope, owner, true).catch(() => undefined);
        }
      });

      if (!locked) {
        schedule();
      }
    } catch {
      if (active()) {
        options.storageError();
      }
    } finally {
      running = false;

      if (dirty && active() && timer === undefined) {
        queueMicrotask(() => {
          void drain();
        });
      }
    }
  };

  return {
    drain,
    retry: async (id: string) => {
      await updateMessageDocument(options.scope, (current) => ({
        ...current,
        intents: current.intents.map((item) =>
          item.id === id ? { ...item, state: 'queued' } : item,
        ),
      }));
      options.changed();
      clearTimeout(timer);
      timer = undefined;
      void drain();
    },
    stop: () => {
      stopped = true;
      controller?.abort();
      clearTimeout(timer);
    },
  };
};
