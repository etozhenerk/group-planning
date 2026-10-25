import { useState } from 'react';
import type { FormEvent } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlacePoll, guarded, accessEpoch, useAccess } from '@/entities/meeting';
import type { Meeting, PlacePollCreate } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';
import { resolveTime } from '@/shared/lib/time';
import { placePollError } from '@/features/place-poll/model/placePollCopy';

export const usePlaceForm = (meeting: Meeting, session: Session, done: () => void) => {
  const [place, setPlace] = useState('');
  const [explanation, setExplanation] = useState('');
  const [validation, setValidation] = useState('');
  const [deadline, setDeadline] = useState(() =>
    Temporal.Now.zonedDateTimeISO(meeting.timezone)
      .add({ days: 1 })
      .toPlainDateTime()
      .toString({ smallestUnit: 'minute' }),
  );

  const [choice, setChoice] = useState<'' | 'earlier' | 'later'>('');
  const client = useQueryClient();
  const intent = useIntent();
  const access = useAccess(session.user.id, meeting.id);
  const action = useMutation({
    mutationFn: (input: PlacePollCreate) =>
      guarded(client, session.user.id, meeting.id, access.epoch, () =>
        createPlacePoll(meeting.id, input, session.csrf, intent(input)),
      ),
    onSuccess: () => {
      if (accessEpoch(session.user.id, meeting.id) !== access.epoch) {
        return;
      }

      void client.invalidateQueries({
        queryKey: ['private', session.user.id, meeting.id],
      });
      done();
    },
    retry: false,
  });

  return {
    place,
    setPlace,
    explanation,
    setExplanation,
    deadline,
    setDeadline: (value: string) => {
      setDeadline(value);
      setChoice('');
    },
    choice,
    setChoice,
    pending: action.isPending,
    problem: validation || (action.error ? placePollError(action.error) : ''),
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setValidation('');

      try {
        const trimmed = place.trim();

        if (!trimmed || [...trimmed].length > 500) {
          throw new Error('Введите новое место: от 1 до 500 символов.');
        }

        if (trimmed === meeting.place) {
          throw new Error('Предложите другое место.');
        }

        const closesAt = resolveTime(deadline, meeting.timezone, choice);

        if (Date.parse(closesAt) <= Date.now()) {
          throw new Error('Выберите время окончания позже текущего.');
        }

        if ([...explanation.trim()].length > 2000) {
          throw new Error('Сократите пояснение до 2000 символов.');
        }

        action.mutate({
          place: trimmed,
          closesAt,
          ...(explanation.trim() ? { explanation: explanation.trim() } : {}),
        });
      } catch (error) {
        setValidation(
          error instanceof Error ? error.message : 'Проверьте введённые данные.',
        );
      }
    },
  };
};
