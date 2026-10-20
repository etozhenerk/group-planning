import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Meeting, MeetingDraft } from '@/entities/meeting';
import { draftFor, updateMeeting, useAccess, guarded } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError, errorText } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import { patchDraft } from '@/features/edit-meeting/model/patchDraft';

export const useEdit = (meeting: Meeting, session: Session, onSaved: () => void) => {
  const [original] = useState(() => draftFor(meeting));
  const [value, setValue] = useState(original);
  const [problem, setProblem] = useState('');
  const [revision] = useState(meeting.revision);
  const client = useQueryClient();
  const access = useAccess(session.user.id, meeting.id);
  const intent = useIntent();
  const mutation = useMutation({
    mutationFn: async () => {
      const input = patchDraft(value, original);
      const body = { ...input, expected_revision: revision };

      return guarded(client, session.user.id, meeting.id, access.epoch, () =>
        updateMeeting(meeting.id, input, revision, session.csrf, intent(body)),
      );
    },
    onSuccess: () => {
      void client.invalidateQueries({
        queryKey: ['private', session.user.id, meeting.id],
      });
      void client.invalidateQueries({ queryKey: ['meetings', session.user.id] });
      onSaved();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void client.invalidateQueries({
          queryKey: ['private', session.user.id, meeting.id],
        });
      }
    },
    retry: false,
  });

  const change = (next: MeetingDraft) => {
    setValue(next);
    setProblem('');
    mutation.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProblem('');

    try {
      patchDraft(value, original);
      mutation.mutate();
    } catch (error) {
      setProblem(error instanceof Error ? error.message : 'Проверьте дату.');
    }
  };

  return {
    value,
    change,
    submit,
    pending: mutation.isPending,
    problem: problem || (mutation.error ? errorText(mutation.error) : ''),
    errors: {
      ...(mutation.error instanceof ApiError ? mutation.error.fields : {}),
      ...(problem.includes('дважды') ? { ambiguous: 'choose' } : {}),
    },
    conflict: mutation.error instanceof ApiError && mutation.error.status === 409,
  };
};
