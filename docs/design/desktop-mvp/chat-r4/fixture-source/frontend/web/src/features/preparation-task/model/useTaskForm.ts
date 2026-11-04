import { useState } from 'react';
import type { FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createPreparationTask,
  guarded,
  accessEpoch,
  useAccess,
  useParticipants,
} from '@/entities/meeting';
import type { PreparationTaskCreate } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import {
  taskError,
  uncertainTaskError,
} from '@/features/preparation-task/model/taskCopy';

export const useTaskForm = (
  meeting: string,
  session: Session,
  done: () => void,
  active: boolean,
) => {
  const [title, setTitle] = useState('');
  const [recipient, setRecipient] = useState('');
  const [validation, setValidation] = useState('');
  const client = useQueryClient();
  const intent = useIntent();
  const access = useAccess(session.user.id, meeting);
  const people = useParticipants(meeting, session.user.id, active);
  const participants = people.data?.filter(
    (person) => person.role === 'organizer' || person.answer === 'going',
  );

  const action = useMutation({
    mutationFn: (input: PreparationTaskCreate) =>
      guarded(client, session.user.id, meeting, access.epoch, () =>
        createPreparationTask(meeting, input, session.csrf, intent(input)),
      ),
    onSuccess: async () => {
      if (accessEpoch(session.user.id, meeting) !== access.epoch) {
        return;
      }

      await client.invalidateQueries({ queryKey: ['private', session.user.id, meeting] });
      done();
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 422) {
        void people.refetch();
      }
    },
    retry: false,
  });

  const uncertain = uncertainTaskError(action.error);

  return {
    title,
    setTitle,
    recipient,
    setRecipient,
    people,
    participants,
    pending: action.isPending,
    locked: action.isPending || uncertain,
    uncertain,
    problem: validation || (action.error ? taskError(action.error, true) : ''),
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (action.isPending || access.denied) {
        return;
      }

      if (uncertain && action.variables) {
        action.mutate(action.variables);

        return;
      }

      const trimmed = title.trim();

      if (!trimmed || [...trimmed].length > 200) {
        setValidation('Введите название задачи: от 1 до 200 символов.');

        return;
      }

      if (
        !participants ||
        (recipient && !participants.some((person) => person.user.id === recipient))
      ) {
        setValidation('Выберите участника из списка.');

        return;
      }

      setValidation('');
      action.mutate({ title: trimmed, recipientId: recipient || null });
    },
  };
};
