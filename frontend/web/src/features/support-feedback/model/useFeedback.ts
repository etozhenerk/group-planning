import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useFeedbackDraft } from '@/features/support-feedback/model/useFeedbackDraft';
import { useMutation } from '@tanstack/react-query';
import { z } from 'zod';
import { ApiError, request, writeOptions } from '@/shared/api';
import { buildVersion } from '@/shared/config';
import { useIntent } from '@/shared/lib/intent';
import { readScreenshot } from '@/features/support-feedback/lib/readScreenshot';
import {
  descriptionProblem,
  trimDescription,
} from '@/features/support-feedback/lib/descriptionValidation';
import type {
  FeedbackKind,
  FeedbackScreen,
  Screenshot,
} from '@/features/support-feedback/model/types';

export const useFeedback = (
  initialKind: FeedbackKind,
  initialScreen: FeedbackScreen,
  mobile = false,
) => {
  const draft = useFeedbackDraft(initialKind, initialScreen, mobile);
  const formRef = useRef<HTMLFormElement>(null);
  const kind = draft.value.kind;
  const setKind = (value: FeedbackKind) => draft.edit({ kind: value });
  const screen = draft.value.screen;
  const setScreen = (value: FeedbackScreen) => draft.edit({ screen: value });
  const description = draft.value.description;
  const setDescription = (value: string) => draft.edit({ description: value });
  const [attempted, setAttempted] = useState(false);
  const [emailProblem, setEmailProblem] = useState('');
  const email = draft.value.email;
  const setEmail = (value: string) => {
    setEmailProblem('');
    draft.edit({ email: value });
  };

  const diagnostics = draft.value.diagnostics;
  const setDiagnostics = (value: boolean) => draft.edit({ diagnostics: value });
  const screenshot = draft.value.screenshot;
  const setScreenshot = (value: Screenshot | null) => draft.edit({ screenshot: value });
  const [fileError, setFileError] = useState('');
  const [reading, setReading] = useState(false);
  const intent = useIntent();
  const mutation = useMutation({
    mutationFn: async () => {
      const content = draft.value.pending?.content ?? {
        kind,
        screen,
        description: trimDescription(description),
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

      const key = draft.value.pending?.key ?? intent(content);

      if (mobile) {
        draft.patch({ pending: { content, key }, busy: true, error: null });
      }

      try {
        const receipt = await request(
          z.object({
            id: z.uuid(),
            reference: z.string(),
            status: z.literal('accepted'),
          }),
          '/support/feedback',
          writeOptions('POST', null, { ...content, client_request_id: key }, key),
          true,
        );

        if (mobile) {
          draft.patch({ receipt, pending: null, error: null });
        }

        return receipt;
      } catch (error) {
        if (mobile) {
          draft.patch({
            error: error instanceof Error ? error : new Error('invalid_response'),
            pending:
              error instanceof ApiError && [400, 422].includes(error.status)
                ? null
                : { content, key },
          });
        }

        throw error;
      } finally {
        if (mobile) {
          draft.patch({ busy: false });
        }
      }
    },
    retry: false,
  });

  const choose = async (file: File | undefined) => {
    if (!file || (mobile && !!draft.value.pending)) {
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
    setAttempted(true);

    if (descriptionProblem(description)) {
      formRef.current?.querySelector<HTMLElement>('[name="description"]')?.focus();

      return;
    }

    const emailField = formRef.current?.querySelector<HTMLInputElement>('[name="email"]');

    if (mobile && emailField && !emailField.validity.valid) {
      setEmailProblem('Проверьте адрес почты.');
      emailField.focus();

      return;
    }

    setEmailProblem('');

    if (!reading && !mutation.isPending && !draft.value.busy) {
      mutation.mutate();
    }
  };

  const failure = mobile ? draft.value.error : mutation.error;
  const fields = failure instanceof ApiError ? failure.fields : {};

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
    descriptionError:
      (attempted ? descriptionProblem(description) : '') ||
      (fields.description ? 'Проверьте сообщение — от 10 до 3000 символов.' : ''),
    setDescription,
    email,
    emailProblem: emailProblem || (fields.email ? 'Проверьте адрес почты.' : ''),
    setEmail,
    diagnostics,
    setDiagnostics,
    screenshot,
    setScreenshot,
    fileError,
    reading,
    choose,
    submit,
    mutation: mobile
      ? {
          ...mutation,
          data: draft.value.receipt,
          error: failure,
          isPending: draft.value.busy,
        }
      : mutation,
    frozen: mobile && !!draft.value.pending && !draft.value.busy,
    scroll: draft.scroll,
    reset: draft.reset,
    fields,
  };
};
