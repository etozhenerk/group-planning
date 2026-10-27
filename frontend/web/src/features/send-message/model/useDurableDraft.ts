import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { accessEpoch, privateKey } from '@/entities/meeting';
import { openPrivateScope, observePrivateStore } from '@/shared/lib/private-store';
import type { PrivateScope } from '@/shared/lib/private-store';
import {
  emptyMessageDocument,
  readMessageDocument,
  updateMessageDocument,
} from '@/features/send-message/model/messageStore';
import type { MessageDraft } from '@/features/send-message/model/messageStore';

export const useDurableDraft = (user: string, id: string, epoch: number) => {
  const client = useQueryClient();
  const publishPresence = useCallback(
    (text: string) =>
      client.setQueryData(privateKey(user, id, epoch, 'draft-occupied'), !!text),
    [client, user, id, epoch],
  );

  const [draft, setDraft] = useState<MessageDraft>(emptyMessageDocument().draft);
  const current = useRef(draft);
  const [scope, setScope] = useState<PrivateScope | null>(null);
  const [storageError, setStorageError] = useState(false);
  const ready = useRef<Promise<PrivateScope> | null>(null);
  const writing = useRef(Promise.resolve());
  useEffect(() => {
    let disposed = false;
    current.current = emptyMessageDocument().draft;
    setDraft(current.current);
    publishPresence(current.current.text);
    setScope(null);
    const opening = openPrivateScope(user, id);
    ready.current = opening;
    void opening
      .then(async (value) => {
        const document = await readMessageDocument(value);

        if (disposed || accessEpoch(user, id) !== epoch) {
          return;
        }

        if (!current.current.revision) {
          current.current = document.draft;
          setDraft(document.draft);
          publishPresence(document.draft.text);
        }

        setScope(value);
      })
      .catch(() => {
        if (!disposed) {
          setStorageError(true);
        }
      });

    return () => {
      disposed = true;
    };
  }, [user, id, epoch, publishPresence]);

  useEffect(() => {
    if (!scope) {
      return;
    }

    return observePrivateStore((event) => {
      if (
        event.kind !== 'changed' ||
        event.user !== user ||
        event.meeting !== id ||
        current.current.text
      ) {
        return;
      }

      const revision = current.current.revision;
      void writing.current
        .then(() => readMessageDocument(scope))
        .then((document) => {
          if (
            accessEpoch(user, id) === epoch &&
            current.current.revision === revision &&
            !current.current.text &&
            document.draft.text
          ) {
            current.current = document.draft;
            setDraft(document.draft);
            publishPresence(document.draft.text);
          }
        })
        .catch(() => undefined);
    });
  }, [scope, user, id, epoch, publishPresence]);

  const save = (next: MessageDraft) => {
    if (accessEpoch(user, id) !== epoch) {
      return;
    }

    current.current = next;
    setDraft(next);
    publishPresence(next.text);
    const opening = ready.current;
    writing.current = writing.current
      .catch(() => undefined)
      .then(async () => {
        const value = await opening;

        if (!value || accessEpoch(user, id) !== epoch) {
          throw new DOMException('Stale draft', 'AbortError');
        }

        await updateMessageDocument(value, (document) => ({ ...document, draft: next }));
      })
      .catch(() => setStorageError(true));
  };

  return {
    draft,
    scope,
    storageError,
    setStorageError,
    current,
    flush: async () => {
      await writing.current;

      return ready.current;
    },
    setText: (text: string) =>
      save({
        text,
        selection: { start: text.length, end: text.length },
        revision: crypto.randomUUID(),
      }),
    rememberSelection: (selection: MessageDraft['selection']) =>
      save({ ...current.current, selection }),
    clear: (revision: string) => {
      if (current.current.revision === revision) {
        current.current = emptyMessageDocument().draft;
        setDraft(current.current);
        publishPresence(current.current.text);
      }
    },
  };
};
