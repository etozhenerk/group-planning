import { useState } from 'react';
import type { FormEvent } from 'react';
import { Temporal } from '@js-temporal/polyfill';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createDatePoll, guarded, accessEpoch, useAccess } from '@/entities/meeting';
import type { Meeting, PollSettings } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { useIntent } from '@/shared/lib/intent';
import { resolveTime, validDay, editLocalTime } from '@/shared/lib/time';
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

  const client = useQueryClient();
  const intent = useIntent();
  const access = useAccess(session.user.id, meeting.id);
  const mutation = useMutation({
    mutationFn: async () => {
      if (dates.length < 2 || dates.some((day) => !validDay(day))) {
        throw new Error('Предложите хотя бы две даты.');
      }

      if (new Set(dates).size !== dates.length) {
        throw new Error('Варианты не должны повторяться.');
      }

      const closesAt = resolveTime(deadline, meeting.timezone, choice);

      if (Date.parse(closesAt) <= Date.now()) {
        throw new Error('Выберите время окончания позже текущего.');
      }

      const input = { dates, closesAt, settings };

      return guarded(client, session.user.id, meeting.id, access.epoch, () =>
        createDatePoll(meeting.id, input, session.csrf, intent(input)),
      );
    },
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

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    mutation.mutate();
  };

  const changeDate = (index: number, value: string) => {
    setDates((before) => before.map((day, i) => (i === index ? value : day)));
    mutation.reset();
  };

  const remove = (index: number) =>
    setDates((before) => before.filter((_, i) => i !== index));

  const add = () => setDates((before) => (before.length < 20 ? [...before, ''] : before));
  const changeSetting = (key: keyof PollSettings, value: boolean) =>
    setSettings((before) => ({ ...before, [key]: value }));

  const problem = mutation.error ? pollError(mutation.error) : '';

  return {
    dates,
    changeDate,
    remove,
    add,
    deadline,
    setDeadline: (value: string) => {
      setDeadline(value);
      setChoice('');
    },
    choice,
    setChoice,
    settings,
    changeSetting,
    submit,
    pending: mutation.isPending,
    problem,
  };
};
