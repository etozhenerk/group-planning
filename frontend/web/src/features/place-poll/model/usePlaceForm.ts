import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createPlacePoll, guarded, accessEpoch, useAccess } from '@/entities/meeting';
import type { Meeting, PlacePollCreate } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import { resolveTime } from '@/shared/lib/time';
import { placePollError } from '@/features/place-poll/model/placePollCopy';

export const usePlaceForm = (meeting: Meeting, session: Session, done: () => void) => {
  const [place, setPlace] = useState('');
  const [explanation, setExplanation] = useState('');
  const [validation, setValidation] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const notified = useRef(false);
  const [deadline, setDeadline] = useState(() =>
    Temporal.Now.zonedDateTimeISO(meeting.timezone)
      .add({ days: 1 })
      .toPlainDateTime()
      .toString({ smallestUnit: 'minute' }),
  );

  const [choice, setChoice] = useState<'' | 'earlier' | 'later'>('');
  const currentDraft = JSON.stringify({ place, explanation, deadline, choice });
  const [originalDraft] = useState(currentDraft);
  useEffect(() => {
    if (saved && !notified.current) {
      notified.current = true;
      done();
    }
  }, [saved, done]);
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
      setSaved(true);
    },
    retry: false,
  });

  const uncertain =
    !!action.error &&
    !(
      action.error instanceof ApiError &&
      action.error.status >= 400 &&
      action.error.status < 500
    );

  const locked = action.isPending || uncertain;
  const edit = (change: () => void) => {
    if (locked) {
      return;
    }

    change();
    setValidation('');
    setErrors({});
    action.reset();
  };

  return {
    place,
    errors,
    attempt,
    dirty: !saved && currentDraft !== originalDraft,
    failed: !!action.error,
    setPlace: (value: string) => edit(() => setPlace(value)),
    explanation,
    setExplanation: (value: string) => edit(() => setExplanation(value)),
    deadline,
    setDeadline: (value: string) =>
      edit(() => {
        setDeadline(value);
        setChoice('');
      }),
    choice,
    setChoice: (value: '' | 'earlier' | 'later') => edit(() => setChoice(value)),
    pending: action.isPending,
    locked,
    uncertain,
    problem:
      validation ||
      (uncertain
        ? 'Не удалось подтвердить создание опроса. Повторите отправку.'
        : action.error
          ? placePollError(action.error)
          : ''),
    submit: (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      if (action.isPending || access.denied) {
        return;
      }

      if (uncertain && action.variables) {
        action.mutate(action.variables);

        return;
      }

      setValidation('');
      setErrors({});
      setAttempt((value) => value + 1);

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
        const text =
          error instanceof Error ? error.message : 'Проверьте введённые данные.';

        setValidation(text);
        const field = text.includes('место')
          ? 'place'
          : text.includes('пояснение')
            ? 'explanation'
            : text.includes('дважды')
              ? 'ambiguous'
              : !deadline.split('T')[0] || text.includes('окончания позже')
                ? 'date'
                : 'time';

        const fieldText =
          field === 'place'
            ? !place.trim()
              ? 'Укажите новое место'
              : [...place.trim()].length > 500
                ? 'Сократите место до 500 символов'
                : 'Предложите другое место'
            : field === 'explanation'
              ? 'Сократите пояснение до 2000 символов'
              : text;

        setErrors({ [field]: fieldText });
      }
    },
  };
};
