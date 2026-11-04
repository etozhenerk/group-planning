import { useEffect, useRef, useState } from 'react';
import type { DatePoll, PollAction, PollCreate } from '@/entities/meeting';
import { useChatPreview as useChatBase } from '@preview/useChatBase';
import { formModes, pollFor, detailsFor } from '@preview/pollFixtures';
import { dayLabel } from '@/shared/lib/time';
import { message, user } from '@preview/data';
export const useChatPreview = () => {
  const base = useChatBase(),
    [poll, setPoll] = useState(() => pollFor(base.scenario)),
    [details, setDetails] = useState(() => detailsFor(base.scenario));
  const [showPoll, setShowPoll] = useState(!formModes.has(base.scenario)),
    [created, setCreated] = useState(false),
    [formGuard, setFormGuard] = useState(false),
    [voting, setVoting] = useState(false),
    [voteError, setVoteError] = useState(false),
    [result, setResult] = useState(base.scenario === 'applied');
  const lock = useRef(false),
    timer = useRef<number | undefined>(),
    modeRef = useRef(base.scenario);
  const session = ['tie-organizer', 'awaiting-time'].includes(base.scenario)
    ? { ...user, user: { id: 'lena', displayName: 'Лена' } }
    : user;
  useEffect(() => {
    modeRef.current = base.scenario;
    window.clearTimeout(timer.current);
    lock.current = false;
    setPoll(pollFor(base.scenario));
    setDetails(detailsFor(base.scenario));
    setShowPoll(!formModes.has(base.scenario));
    setCreated(false);
    setFormGuard(false);
    setVoting(false);
    setVoteError(false);
    setResult(base.scenario === 'applied');
  }, [base.scenario]);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const apply = (next: DatePoll, optionId: string, startsAt?: string | null) => {
    const date = next.options.find((option) => option.id === optionId)!.date;
    setPoll({
      ...next,
      state: 'applied',
      appliedOptionId: optionId,
      canVote: false,
      canAddOptions: false,
      canResolve: false,
    });
    setDetails((previous) => ({
      ...previous,
      startsOn: date,
      startsAt: startsAt ?? date + 'T17:00:00Z',
    }));
    setResult(true);
  };
  const vote = (action: PollAction, onSuccess?: () => void, onError?: (error: Error) => void) => {
    if (lock.current) {
      return;
    }
    lock.current = true;
    setVoting(true);
    const generation = modeRef.current;
    timer.current = window.setTimeout(() => {
      lock.current = false;
      setVoting(false);
      if (generation !== modeRef.current) {
        return;
      }
      if (base.scenario === 'vote-error' && !voteError) {
        setVoteError(true);
        onError?.(new Error('Не удалось сохранить голос. Попробуйте ещё раз.'));
        return;
      }
      setVoteError(false);
      if (action.kind === 'vote') {
        const next = {
          ...poll,
          myOptionIds: action.optionIds,
          canVote: poll.settings.allowRevoting,
          myVoteRevision: String(Number(poll.myVoteRevision) + 1),
          options: poll.options.map((option) => ({
            ...option,
            votes: poll.settings.hideResults
              ? null
              : (option.votes ?? 0) -
                (poll.myOptionIds.includes(option.id) ? 1 : 0) +
                (action.optionIds.includes(option.id) ? 1 : 0),
            voters:
              poll.settings.anonymous || poll.settings.hideResults
                ? null
                : [
                    ...(option.voters ?? []).filter(
                      (person) => person.id !== session.user.id,
                    ),
                    ...(action.optionIds.includes(option.id)
                      ? [{ id: session.user.id, displayName: session.user.displayName }]
                      : []),
                  ],
          })),
        };
        const winner = !poll.settings.hideResults
          ? next.options.find(
              (option) => (option.votes ?? 0) > details.participantCount / 2,
            )
          : undefined;
        if (winner) {
          apply(next, winner.id);
        } else {
          setPoll(next);
        }
      } else if (action.kind === 'options') {
        if (poll.options.some((option) => option.date === action.date)) {
          setVoteError(true);
          onError?.(new Error('Эта дата уже есть в опросе.'));
          return;
        }
        setPoll((previous) => ({
          ...previous,
          options: [
            ...previous.options,
            {
              id: 'date-' + crypto.randomUUID(),
              date: action.date,
              votes: previous.settings.hideResults ? null : 0,
              voters:
                previous.settings.hideResults || previous.settings.anonymous ? null : [],
            },
          ],
        }));
      } else {
        apply(poll, action.optionId, action.startsAt);
      }
      onSuccess?.();
    }, 350);
  };
  const addPoll = (input: PollCreate) => {
    if (showPoll) {
      return false;
    }
    setPoll({
      ...pollFor('poll'),
      author: { id: session.user.id, displayName: session.user.displayName },
      settings: input.settings,
      canAddOptions: input.settings.allowNewOptions,
      closesAt: input.closesAt,
      options: input.dates.map((date, index) => ({
        id: 'new-' + index,
        date,
        votes: input.settings.hideResults ? null : 0,
        voters: input.settings.anonymous || input.settings.hideResults ? null : [],
      })),
    });
    setShowPoll(true);
    setCreated(true);
    return true;
  };
  const entry = {
    ...message('date-preview-entry', created ? 'misha' : 'lena', '', 16),
    text: null,
    pollId: poll.id,
  };
  const system = {
    ...message('date-result', 'lena', '', 18),
    text: null,
    kind: 'event',
    event: 'Для встречи выбрали ' + dayLabel(details.startsOn!) + '.',
  };
  const entries = showPoll
    ? [...base.entries.filter((item) => !item.pollId), entry, ...(result ? [system] : [])]
    : base.entries.filter((item) => !item.pollId);
  return {
    ...base,
    poll,
    vote,
    addPoll,
    details,
    session,
    entries,
    formGuard,
    setFormGuard,
    voting,
    voteError,
  };
};
