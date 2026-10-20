import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import type { FormEvent } from 'react';
import type { Session } from '@/entities/session';
import { createMeeting, draftInput, emptyDraft } from '@/entities/meeting';
import type { MeetingDraft } from '@/entities/meeting';
import { ApiError, errorText } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import {
  readDraft,
  removeDraft,
  storeDraft,
} from '@/features/create-meeting/model/draftStorage';
import { useUnsaved } from '@/features/create-meeting/model/useUnsaved';

export const useCreateMeeting = (session: Session) => {
  const [value, setValue] = useState(() => readDraft(session.user.id));
  const [localError, setLocalError] = useState('');
  const [saved, setSaved] = useState(false);
  const [destination, setDestination] = useState<string | null>(null);
  const client = useQueryClient();
  const navigate = useNavigate();
  const intent = useIntent();
  const dirty = !saved && JSON.stringify(value) !== JSON.stringify(emptyDraft());
  const unsaved = useUnsaved(dirty);
  const mutation = useMutation({
    mutationFn: async () => {
      const input = draftInput(value);

      return createMeeting(input, session.csrf, intent(input));
    },
    onSuccess: (result) => {
      removeDraft(session.user.id);
      setSaved(true);
      void client.invalidateQueries({ queryKey: ['meetings', session.user.id] });
      setDestination(`/meetings/${result.meeting.id}/created`);
    },
    retry: false,
  });

  useEffect(() => {
    if (destination) {
      void navigate(destination);
    }
  }, [destination, navigate]);
  const errors = mutation.error instanceof ApiError ? mutation.error.fields : {};
  const problem = localError || (mutation.error ? errorText(mutation.error) : '');
  const change = (next: MeetingDraft) => {
    setValue(next);
    storeDraft(session.user.id, next);
    setLocalError('');
    mutation.reset();
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError('');

    try {
      draftInput(value);
      mutation.mutate();
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Проверьте дату и время.');
    }
  };

  return {
    value,
    change,
    submit,
    pending: mutation.isPending,
    problem,
    errors: {
      ...errors,
      ...(localError.includes('дважды') ? { ambiguous: 'choose' } : {}),
    },
    unsaved,
  };
};
