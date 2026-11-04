import { useRef } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@/entities/session';
import { accessEpoch, privateKey, useAccess } from '@/entities/meeting';
import { usePendingMessages } from '@/features/send-message/model/usePendingMessages';
import { useDurableDraft } from '@/features/send-message/model/useDurableDraft';
import { useOutboxQueue } from '@/features/send-message/model/useOutboxQueue';
import { enqueueMessage } from '@/features/send-message/model/messageStore';
import type { MessageIntent } from '@/features/send-message/model/messageStore';
import type { PendingMessage } from '@/features/send-message/model/types';

export const useSendMessage = (id: string, session: Session) => {
  const client = useQueryClient();
  const user = session.user.id;
  const access = useAccess(user, id);
  const draft = useDurableDraft(user, id, access.epoch);
  const { pending } = usePendingMessages(user, id, access.epoch);
  const queue = useOutboxQueue(id, session, access.epoch, draft.scope, () =>
    draft.setStorageError(true),
  );

  const saving = useRef(false);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const input = draft.current.current;

    if (!input.text.trim() || access.denied || saving.current) {
      return;
    }

    saving.current = true;

    try {
      const scope = await draft.flush();

      if (!scope || accessEpoch(user, id) !== access.epoch) {
        return;
      }

      const intent: MessageIntent = {
        id: crypto.randomUUID(),
        text: input.text,
        createdAt: new Date().toISOString(),
        state: 'queued',
      };

      await enqueueMessage(scope, intent, input.revision);

      if (accessEpoch(user, id) !== access.epoch) {
        return;
      }

      client.setQueryData<PendingMessage[]>(
        privateKey(user, id, access.epoch, 'pending-messages'),
        (previous) => [
          ...(previous ?? []).filter((item) => item.id !== intent.id),
          { ...intent, delivery: intent.state, state: 'sending' },
        ],
      );
      draft.clear(input.revision);
      draft.setStorageError(false);
      void queue.current?.drain();
    } catch {
      draft.setStorageError(true);
    } finally {
      saving.current = false;
    }
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();

      if (draft.draft.text.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  return {
    text: draft.draft.text,
    setText: draft.setText,
    selection: draft.draft.selection,
    rememberSelection: draft.rememberSelection,
    storageError: draft.storageError,
    pending,
    submit,
    keyDown,
    retry: async (message: PendingMessage) => {
      await queue.current?.retry(message.id);
    },
    disabled: access.denied,
  };
};
