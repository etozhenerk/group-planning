import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meeting, MeetingDraft, MeetingInput } from '@/entities/meeting';
import { draftFor, updateMeeting, useAccess, guarded } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError, errorText } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import { rebaseDraft } from '@/features/edit-meeting/model/rebaseDraft';
import { patchDraft } from '@/features/edit-meeting/model/patchDraft';

export const useEdit = (meeting: Meeting, session: Session, onSaved: () => void) => {
  const [original, setOriginal] = useState(() => draftFor(meeting));
  const [value, setValue] = useState(original);
  const [problem, setProblem] = useState('');
  const [revision, setRevision] = useState(meeting.revision);
  const [preparing, setPreparing] = useState(false);
  const [validationAttempt, setValidationAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const notified = useRef(false);
  const client = useQueryClient();
  const access = useAccess(session.user.id, meeting.id);
  const intent = useIntent();
  const mutation = useMutation({
    mutationFn: async (body: Partial<MeetingInput> & { expected_revision: string }) => {
      const { expected_revision: expected, ...input } = body;

      return guarded(
        client,
        session.user.id,
        meeting.id,
        access.epoch,
        () => updateMeeting(meeting.id, input, expected, session.csrf, intent(body)),
        'operation',
      );
    },
    onSuccess: async () => {
      await client.invalidateQueries({
        queryKey: ['private', session.user.id, meeting.id],
      });
      void client.invalidateQueries({ queryKey: ['meetings', session.user.id] });
      setSaved(true);
    },
    onError: (error) => {
      setValidationAttempt((value) => value + 1);

      if (error instanceof ApiError && [403, 409].includes(error.status)) {
        void client.invalidateQueries({
          queryKey: ['private', session.user.id, meeting.id],
        });
      }
    },
    retry: false,
  });

  const uncertain =
    !!mutation.error &&
    !(
      mutation.error instanceof ApiError &&
      mutation.error.status >= 400 &&
      mutation.error.status < 500
    );

  const conflict = mutation.error instanceof ApiError && mutation.error.status === 409;
  const forbidden = mutation.error instanceof ApiError && mutation.error.status === 403;
  useEffect(() => {
    if (saved && !notified.current) {
      notified.current = true;
      onSaved();
    }
  }, [saved, onSaved]);

  const change = (next: MeetingDraft) => {
    if (mutation.isPending || uncertain || conflict || forbidden) {
      return;
    }

    setValue(next);
    setProblem('');
    mutation.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mutation.isPending || preparing) {
      return;
    }

    setProblem('');
    setValidationAttempt((value) => value + 1);

    try {
      mutation.mutate(
        uncertain && mutation.variables
          ? mutation.variables
          : { ...patchDraft(value, original), expected_revision: revision },
      );
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Проверьте дату.');
    }
  };

  const fieldErrors: Record<string, string> = {
    ...(mutation.error instanceof ApiError ? mutation.error.fields : {}),
    ...(problem.includes('название') ? { title: problem } : {}),
    ...(problem.includes('дважды') ? { ambiguous: 'choose' } : {}),
  };

  return {
    value,
    validationAttempt,
    change,
    submit,
    pending: mutation.isPending,
    locked: mutation.isPending || uncertain || preparing || conflict || forbidden,
    dirty: !saved && JSON.stringify(value) !== JSON.stringify(original),
    saved,
    forbidden,
    preparing,
    setPreparing,
    uncertain,
    rebaseReady: meeting.revision !== revision,
    refresh: () =>
      client.invalidateQueries({ queryKey: ['private', session.user.id, meeting.id] }),
    resume: () => {
      const current = draftFor(meeting);
      setValue(rebaseDraft(value, original, current));
      setOriginal(current);
      setRevision(meeting.revision);
      mutation.reset();
    },
    problem:
      problem ||
      (uncertain
        ? 'Не удалось подтвердить сохранение. Повторите отправку.'
        : mutation.error
          ? errorText(mutation.error)
          : ''),
    errors: fieldErrors,
    conflict,
  };
};
