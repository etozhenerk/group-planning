import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError, request, writeOptions } from '@/shared/api';
import { buildVersion } from '@/shared/config';
import { useIntent } from '@/shared/lib/intent';
import { readScreenshot } from '@/features/support-feedback/lib/readScreenshot';
import type {
  FeedbackKind,
  FeedbackScreen,
  Screenshot,
} from '@/features/support-feedback/model/types';

export const useFeedback = (initialKind: FeedbackKind, initialScreen: FeedbackScreen) => {
  const formRef = useRef<HTMLFormElement>(null);
  const [kind, setKind] = useState(initialKind);
  const [screen, setScreen] = useState(initialScreen);
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [diagnostics, setDiagnostics] = useState(false);
  const [screenshot, setScreenshot] = useState<Screenshot | null>(null);
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const intent = useIntent();
  const mutation = useMutation({
    mutationFn: async () => {
      const content = {
        kind,
        screen,
        description: description.trim(),
        email: email.trim() || null,
        screenshot,
        diagnostics: diagnostics
          ? {
              client_version: buildVersion,
              platform: 'web',
              browser: navigator.userAgent,
              viewport: { width: window.innerWidth, height: window.innerHeight },
            }
          : null,
      };

      const key = intent(content);

      return request(
        z.object({ id: z.uuid(), reference: z.string(), status: z.literal('accepted') }),
        '/support/feedback',
        writeOptions('POST', null, { ...content, client_request_id: key }, key),
        true,
      );
    },
    retry: false,
  });

  const choose = async (file: File | undefined) => {
    if (!file) {
      return;
    }

    setReading(true);
    setFileError('');

    try {
      setScreenshot(await readScreenshot(file));
    } catch (error) {
      setFileError(error instanceof Error ? error.message : 'Не удалось открыть файл.');
    } finally {
      setReading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reading) {
      mutation.mutate();
    }
  };

  const fields = mutation.error instanceof ApiError ? mutation.error.fields : {};

  useEffect(() => {
    if (mutation.error instanceof ApiError) {
      const field = Object.keys(mutation.error.fields).find((name) =>
        ['description', 'email'].includes(name),
      );

      if (field) {
        formRef.current?.querySelector<HTMLElement>(`[name="${field}"]`)?.focus();
      }
    }
  }, [mutation.error]);

  return {
    formRef,
    kind,
    setKind,
    screen,
    setScreen,
    description,
    setDescription,
    email,
    setEmail,
    diagnostics,
    setDiagnostics,
    screenshot,
    setScreenshot,
    fileError,
    reading,
    choose,
    submit,
    mutation,
    fields,
  };
};
