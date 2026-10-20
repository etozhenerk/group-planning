import { useEffect, useRef, useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import type { Session } from '@/entities/session';
import type { Conversation } from '@/entities/meeting';
import {
  guarded,
  mergeEntries,
  privateKey,
  sendMessage,
  useAccess,
} from '@/entities/meeting';
import type { PendingMessage } from '@/features/send-message/model/types';

export const useSendMessage = (id: string, session: Session) => {
  const client = useQueryClient();
  const access = useAccess(session.user.id, id);
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PendingMessage[]>([]);
  const controllers = useRef(new Set<AbortController>());
  const disposed = useRef(false);
  useEffect(() => {
    disposed.current = false;
    const active = controllers.current;

    return () => {
      disposed.current = true;

      for (const controller of active) {
        controller.abort();
      }

      active.clear();
    };
  }, [id, session.user.id]);
  useEffect(() => {
    const key = privateKey(session.user.id, id, access.epoch, 'feed');

    return client.getQueryCache().subscribe(() => {
      const entries = client.getQueryData<Conversation>(key)?.entries;

      if (!entries) {
        return;
      }

      const confirmed = new Set(entries.map((entry) => entry.clientRequestId));
      setPending((values) =>
        values.some((value) => confirmed.has(value.id))
          ? values.filter((value) => !confirmed.has(value.id))
          : values,
      );
    });
  }, [client, id, session.user.id, access.epoch]);
  const deliver = async (message: PendingMessage) => {
    const controller = new AbortController();
    controllers.current.add(controller);
    setPending((values) =>
      values.map((value) =>
        value.id === message.id ? { ...value, state: 'sending' } : value,
      ),
    );

    try {
      const entry = await guarded(client, session.user.id, id, access.epoch, () =>
        sendMessage(id, message.text, message.id, session.csrf, controller.signal),
      );

      if (disposed.current) {
        return;
      }

      client.setQueryData<Conversation>(
        privateKey(session.user.id, id, access.epoch, 'feed'),
        (previous) =>
          previous
            ? { ...previous, entries: mergeEntries(previous.entries, [entry]) }
            : undefined,
      );
      setPending((values) => values.filter((value) => value.id !== message.id));
    } catch {
      if (!disposed.current && !controller.signal.aborted) {
        setPending((values) =>
          values.map((value) =>
            value.id === message.id ? { ...value, state: 'failed' } : value,
          ),
        );
      }
    } finally {
      controllers.current.delete(controller);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!text.trim() || access.denied) {
      return;
    }

    const message: PendingMessage = { id: crypto.randomUUID(), text, state: 'sending' };
    setPending((values) => [...values, message]);
    setText('');
    void deliver(message);
  };

  const keyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();

      if (text.trim()) {
        event.currentTarget.form?.requestSubmit();
      }
    }
  };

  return {
    text,
    setText,
    pending,
    submit,
    keyDown,
    retry: deliver,
    disabled: access.denied,
  };
};
