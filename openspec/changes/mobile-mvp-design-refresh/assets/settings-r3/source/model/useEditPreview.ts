import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { Meeting, MeetingDraft } from '@/entities/meeting';
import type { Session } from '@/entities/session';
import { draftFor, draftInput } from '@/entities/meeting/model/draft';
import { coverDataURL } from '@/entities/meeting/model/cover';
import { meetingSeed } from '@preview/model/data';
import { useInfoModel } from '@preview/model/InfoContext';
export const useEdit = (meeting: Meeting, _session: Session, onSaved: () => void) => {
  const m = useInfoModel(),
    mode = m.scenario;
  const initial = draftFor(mode === 'conflict' ? meetingSeed : meeting);
  const [original, setOriginal] = useState(initial);
  const [value, setValue] = useState<MeetingDraft>(() =>
    mode === 'validation'
      ? { ...initial, title: '', localTime: 'T' }
      : ['save-error', 'uncertain', 'conflict'].includes(mode)
        ? { ...initial, title: 'Ужин на Покровке' }
        : initial,
  );
  const [errors, setErrors] = useState<Record<string, string>>(
    mode === 'validation' ? { title: 'required', starts_on: 'required' } : {},
  );
  const [problem, setProblem] = useState(
    mode === 'save-error'
      ? 'error'
      : mode === 'uncertain'
        ? 'uncertain'
        : mode === 'conflict'
          ? 'conflict'
          : '',
  );
  const [pending, setPending] = useState(mode === 'saving'),
    [preparing, setPreparing] = useState(false),
    [review, setReview] = useState(false);
  const timer = useRef<number | undefined>(undefined);
  const uncertain = problem === 'uncertain',
    conflict = problem === 'conflict',
    locked = pending || preparing || uncertain;
  const dirty = JSON.stringify(value) !== JSON.stringify(original);
  const change = (next: MeetingDraft) => {
    if (locked) {
      return;
    }
    setValue(next);
    setErrors((previous) => {
      const copy = { ...previous };
      if (next.title.trim()) {
        delete copy.title;
      }
      if(next.localTime!==value.localTime){delete copy.starts_at;delete copy.ambiguous}
      if (next.localTime.split('T')[0]) {
        delete copy.starts_on;
      }
      return copy;
    });
    if (problem !== 'conflict') {
      setProblem('');
    }
  };
  const close = () => {
    if (pending || preparing || uncertain) {
      return;
    }
    if (review) {
      setReview(false);
      return;
    }
    if (m.guard) {
      m.setGuard(false);
      return;
    }
    if (dirty) {
      m.setGuard(true);
    } else {
      m.backToInfo();
    }
  };
  useEffect(() => {
    window.addEventListener('settings-request-close', close);
    return () => window.removeEventListener('settings-request-close', close);
  }, [pending, preparing, uncertain, dirty, m.guard, review]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const save = () => {
    setPending(true);
    timer.current = window.setTimeout(() => {
      const input = draftInput(value);
      m.setMeeting((previous) => ({
        ...previous,
        title: input.title,
        description: input.description,
        place: input.place,
        startsAt: input.starts_at,
        startsOn: input.starts_on,
        timezone: input.timezone,
        coverUrl:
          value.cover === null
            ? null
            : value.cover
              ? coverDataURL(value.cover)
              : previous.coverUrl,
        revision: String(Number(previous.revision) + 1),
      }));
      setPending(false);
      setProblem('');
      onSaved();
    }, 550);
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (pending || preparing) {
      return;
    }
    if (conflict) {
      setReview(true);
      return;
    }
    const invalid: Record<string, string> = {};
    if (!value.title.trim()) {
      invalid.title = 'required';
    }
    if (!value.localTime.split('T')[0]) {
      invalid.starts_on = 'required';
    }
    setErrors(invalid);
    if (Object.keys(invalid).length) {
      requestAnimationFrame(() => {
        const target = document.querySelector<HTMLElement>('[aria-invalid="true"]');
        target?.focus({ preventScroll: true });
        target?.scrollIntoView({ block: 'center', behavior: 'auto' });
      });
      return;
    }
    try {
      draftInput(value);
    } catch (error) {
      const text=error instanceof Error?error.message:'Проверьте дату и время.';
      if(text.includes('дважды')){setErrors({ambiguous:'choose'});setProblem(text)}else{setErrors({starts_at:'invalid'});setProblem('')}
      requestAnimationFrame(()=>document.querySelector<HTMLElement>('[aria-invalid="true"]')?.scrollIntoView({block:'center',behavior:'auto'}));
      return;
    }
    save();
  };
  const resume = () => {
    const fresh = draftFor(m.meeting),
      next = { ...fresh };
    for (const key of [
      'title',
      'description',
      'place',
      'localTime',
      'timezone',
      'timeChoice',
    ] as const) {
      if (value[key] !== original[key]) {
        Object.assign(next, { [key]: value[key] });
      }
    }
    if (value.cover !== undefined) {
      next.cover = value.cover;
    }
    setOriginal(fresh);
    setValue(next);
    setProblem('');
    setReview(false);
  };
  return {
    value,
    change,
    submit,
    errors,
    problem,
    pending,
    preparing,
    setPreparing,
    locked,
    uncertain,
    conflict,
    review,
    setReview,
    resume,
    dirty,
    close,
    stay: () => m.setGuard(false),
    leave: () => m.backToInfo(),
  };
};
