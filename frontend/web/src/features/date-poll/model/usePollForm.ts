import { useState } from 'react';
import type { FormEvent } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDatePoll, guarded, accessEpoch, useAccess } from '@/entities/meeting';
import type { Meeting, PollCreate, PollSettings } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { ApiError } from '@/shared/api';
import { useIntent } from '@/shared/lib/intent';
import { resolveTime, editLocalTime } from '@/shared/lib/time';
import { pollDateErrors } from '@/features/date-poll/model/pollDateErrors';
import { pollError } from '@/features/date-poll/model/pollCopy';

export const usePollForm = (meeting: Meeting, session: Session, done: () => void) => {
  const [dates, setDates] = useState(() => {
    const first =
      meeting.startsOn ?? editLocalTime(meeting.startsAt, meeting.timezone).split('T')[0];

    return first
      ? [first, Temporal.PlainDate.from(first).add({ days: 1 }).toString()]
      : ['', ''];
  });

  const [deadline, setDeadline] = useState(() =>
    Temporal.Now.zonedDateTimeISO(meeting.timezone)
      .add({ days: 1 })
      .toPlainDateTime()
      .toString({ smallestUnit: 'minute' }),
  );

  const [choice, setChoice] = useState<'' | 'earlier' | 'later'>('');
  const [settings, setSettings] = useState<PollSettings>({
    multipleAnswers: true,
    allowRevoting: true,
    allowNewOptions: true,
    anonymous: false,
    hideResults: false,
  });

  const [attempt, setAttempt] = useState(0);
  const [validation, setValidation] = useState('');
  const dateErrors = attempt > 0 ? pollDateErrors(dates) : [];
  const client = useQueryClient();
  const intent = useIntent();
  const access = useAccess(session.user.id, meeting.id);
  const mutation = useMutation({
    mutationFn: (input: PollCreate) =>
      guarded(client, session.user.id, meeting.id, access.epoch, () =>
        createDatePoll(meeting.id, input, session.csrf, intent(input)),
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

  const uncertain =
    !!mutation.error &&
    !(
      mutation.error instanceof ApiError &&
      mutation.error.status >= 400 &&
      mutation.error.status < 500
    );

  const locked = mutation.isPending || uncertain;
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (mutation.isPending || access.denied) {
      return;
    }

    if (uncertain && mutation.variables) {
      mutation.mutate(mutation.variables);

      return;
    }

    setValidation('');
    setAttempt((before) => before + 1);

    if (pollDateErrors(dates).some(Boolean)) {
      return;
    }

    try {
      if (dates.length < 2) {
        throw new Error('Предложите хотя бы две даты.');
      }

      const closesAt = resolveTime(deadline, meeting.timezone, choice);

      if (Date.parse(closesAt) <= Date.now()) {
        throw new Error('Выберите время окончания позже текущего.');
      }

      mutation.mutate({ dates: [...dates], closesAt, settings: { ...settings } });
    } catch (error) {
      setValidation(error instanceof Error ? error.message : 'Проверьте дату.');
    }
  };

  const edit = (change: () => void) => {
    if (locked) {
      return;
    }

    change();
    setValidation('');
    mutation.reset();
  };

  const changeDate = (index: number, value: string) =>
    edit(() => setDates((before) => before.map((day, i) => (i === index ? value : day))));

  const remove = (index: number) =>
    edit(() => setDates((before) => before.filter((_, i) => i !== index)));

  const add = () =>
    edit(() => setDates((before) => (before.length < 20 ? [...before, ''] : before)));

  const changeSetting = (key: keyof PollSettings, value: boolean) =>
    edit(() => setSettings((before) => ({ ...before, [key]: value })));

  const problem =
    validation ||
    (uncertain
      ? 'Не удалось подтвердить создание опроса. Повторите отправку.'
      : mutation.error
        ? pollError(mutation.error)
        : '');

  return {
    dates,
    attempt,
    dateErrors,
    changeDate,
    remove,
    add,
    deadline,
    setDeadline: (value: string) =>
      edit(() => {
        setDeadline(value);
        setChoice('');
      }),
    choice,
    setChoice: (value: '' | 'earlier' | 'later') => edit(() => setChoice(value)),
    settings,
    changeSetting,
    submit,
    pending: mutation.isPending,
    locked,
    uncertain,
    problem,
  };
};
