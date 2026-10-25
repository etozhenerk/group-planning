import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import type { FormEvent } from 'react';
import type { Session } from '@/entities/session';
import { createMeeting, draftInput, emptyDraft } from '@/entities/meeting';
import type { MeetingDraft, MeetingInput } from '@/entities/meeting';
import { ApiError, errorText } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import {
  readDraft,
  readPendingCreation,
  removeDraft,
  storeDraft,
} from '@/features/create-meeting/model/draftStorage';
import { useUnsaved } from '@/features/create-meeting/model/useUnsaved';

type CreationAttempt = { key: string; input: MeetingInput; draft: MeetingDraft };

export const useCreateMeeting = (session: Session) => {
  const { key } = useLocation();
  const [params] = useSearchParams();
  const [attempt, setAttempt] = useState<CreationAttempt | null>(() => {
    const pending = readPendingCreation(session.user.id);

    if (!pending) {
      return null;
    }

    try {
      return { ...pending, input: draftInput(pending.draft) };
    } catch {
      return null;
    }
  });

  const [value, setValue] = useState(
    () => attempt?.draft ?? readDraft(session.user.id, params.get('date'), key),
  );

  const [localError, setLocalError] = useState('');
  const [preparing, setPreparing] = useState(false);
  const [saved, setSaved] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const intent = useIntent();
  const dirty = !saved && JSON.stringify(value) !== JSON.stringify(emptyDraft());
  const unsaved = useUnsaved(dirty);
  const mutation = useMutation({
    mutationFn: (pending: CreationAttempt) =>
      createMeeting(pending.input, session.csrf, pending.key),
    onSuccess: (result) => {
      removeDraft(session.user.id);
      setSaved(true);
      void client.invalidateQueries({ queryKey: ['meetings', session.user.id] });
      setDestination(`/meetings/${result.meeting.id}`);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
        setAttempt(null);
      }
    },
    retry: false,
  });

  useEffect(() => {
    if (!saved) {
      storeDraft(session.user.id, value, key, attempt?.key);
    }
  }, [session.user.id, value, key, saved, attempt]);

  useEffect(() => {
    if (destination) {
      void navigate(destination, { replace: true });
    }
  }, [destination, navigate]);
  const uncertain = !!attempt && !mutation.isPending && !saved;

  const locked = mutation.isPending || uncertain || preparing || saved;
  const errors = mutation.error instanceof ApiError ? mutation.error.fields : {};
  const problem =
    localError ||
    (uncertain
      ? 'Не удалось подтвердить создание. Повторите отправку.'
      : mutation.error
        ? errorText(mutation.error)
        : '');

  const change = (next: MeetingDraft) => {
    if (mutation.isPending || uncertain) {
      return;
    }

    setValue(next);
    setLocalError('');
    mutation.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mutation.isPending || preparing) {
      return;
    }

    setLocalError('');

    try {
      const input = draftInput(value);
      const pending = attempt ?? { key: intent(input), input, draft: value };
      storeDraft(session.user.id, pending.draft, key, pending.key);
      setAttempt(pending);
      mutation.mutate(pending);
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Проверьте дату и время.');
    }
  };

  const fieldErrors: Record<string, string> = {
    ...errors,
    ...(localError.includes('дважды') ? { ambiguous: 'choose' } : {}),
  };

  return {
    value,
    change,
    submit,
    pending: mutation.isPending,
    locked,
    preparing,
    setPreparing,
    uncertain,
    problem,
    errors: fieldErrors,
    unsaved,
  };
};
