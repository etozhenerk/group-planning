import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Meeting, PollSettings } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { resolveTime } from '@/shared/lib/time';
import { pollDateErrors } from '@/features/date-poll/model/pollDateErrors';
import { useChatModel } from '@preview/ChatContext';
export const usePollForm = (meeting: Meeting, _session: Session, done: () => void) => {
  const m = useChatModel(),
    [dates, setDates] = useState(
      m.scenario === 'validation'
        ? ['2026-11-06', '2026-11-06']
        : ['2026-11-06', '2026-11-07'],
    ),
    [attempt, setAttempt] = useState(m.scenario === 'validation' ? 1 : 0);
  const [deadline, setDeadline] = useState('2026-11-05T21:00'),
    [choice, setChoice] = useState<'' | 'earlier' | 'later'>(''),
    [settings, setSettings] = useState<PollSettings>({
      multipleAnswers: true,
      allowRevoting: true,
      allowNewOptions: true,
      anonymous: false,
      hideResults: false,
    });
  const [problem, setProblem] = useState(
      m.scenario === 'form-error'
        ? 'error'
        : m.scenario === 'uncertain'
          ? 'uncertain'
          : '',
    ),
    [deadlineErrors, setDeadlineErrors] = useState<Record<string, string>>({}),
    [pending, setPending] = useState(false);
  const timer = useRef<number | undefined>(),
    snapshot = useRef(JSON.stringify({ dates, deadline, choice, settings })),
    lock = useRef(false);
  const uncertain = problem === 'uncertain',
    locked = pending || uncertain;
  const edit = (change: () => void) => {
    if (locked) {
      return;
    }
    change();
    setProblem('');
    setDeadlineErrors({});
  };
  const dirty =
    JSON.stringify({ dates, deadline, choice, settings }) !== snapshot.current;
  const close = () => {
    if (locked) {
      return;
    }
    if (m.formGuard) {
      m.setFormGuard(false);
    } else if (dirty) {
      m.setFormGuard(true);
    } else {
      done();
    }
  };
  useEffect(() => {
    window.addEventListener('date-form-close', close);
    return () => window.removeEventListener('date-form-close', close);
  }, [dirty, locked, m.formGuard]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (lock.current) {
      return;
    }
    setAttempt((value) => value + 1);
    setDeadlineErrors({});
    if (pollDateErrors(dates).some(Boolean)) {
      return;
    }
    if (!deadline.split('T')[0]) {
      setDeadlineErrors({ date: 'Выберите дату окончания' });
      return;
    }
    if (!deadline.split('T')[1]) {
      setDeadlineErrors({ time: 'Укажите время окончания' });
      return;
    }
    let closesAt: string;
    try {
      closesAt = resolveTime(deadline, meeting.timezone, choice);
      if (Date.parse(closesAt) <= Date.now()) {
        setDeadlineErrors({ date: 'Опрос должен закончиться позже текущего времени' });
        return;
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Проверьте время окончания';
      setDeadlineErrors(text.includes('дважды') ? { ambiguous: text } : { time: text });
      return;
    }
    lock.current = true;
    setPending(true);
    setProblem('');
    timer.current = window.setTimeout(() => {
      lock.current = false;
      setPending(false);
      if (m.addPoll({ dates, closesAt, settings })) {
        done();
      } else {
        setProblem('В этой встрече уже есть незавершённый опрос даты.');
      }
    }, 450);
  };
  return {
    dates,
    attempt,
    dateErrors: attempt ? pollDateErrors(dates) : [],
    changeDate: (index: number, value: string) =>
      edit(() =>
        setDates((previous) => previous.map((date, i) => (i === index ? value : date))),
      ),
    remove: (index: number) =>
      edit(() => setDates((previous) => previous.filter((_, i) => i !== index))),
    add: () =>
      edit(() =>
        setDates((previous) => (previous.length < 20 ? [...previous, ''] : previous)),
      ),
    deadline,
    setDeadline: (value: string) =>
      edit(() => {
        setDeadline(value);
        setChoice('');
      }),
    choice,
    setChoice,
    settings,
    changeSetting: (key: keyof PollSettings, value: boolean) =>
      edit(() => setSettings((previous) => ({ ...previous, [key]: value }))),
    pending,
    locked,
    uncertain,
    problem,
    deadlineErrors,
    submit,
    stay: () => m.setFormGuard(false),
    leave: () => {
      m.setFormGuard(false);
      done();
    },
  };
};
