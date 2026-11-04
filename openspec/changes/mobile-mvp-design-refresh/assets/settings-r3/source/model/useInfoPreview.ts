import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import type { Answer } from '@/shared/api';
import { meetingSeed, peopleSeed, meetingFor } from '@preview/model/data';
export const useInfoPreview = () => {
  const [scenario, setScenario] = useState(
    new URLSearchParams(location.search).get('state') ?? 'ready',
  );
  const [open, setOpen] = useState(true),
    [child, setChild] = useState<string | null>('settings');
  const [meeting, setMeeting] = useState(() => meetingFor(scenario)),
    [answer, setAnswer] = useState<Answer>('going');
  const [busy, setBusy] = useState(false),
    [responseError, setResponseError] = useState(false),
    [rosterError, setRosterError] = useState(false);
  const opener = useRef<HTMLElement | null>(null);
  const showChild = (kind: string, element: HTMLElement) => {
    opener.current = element;
    setSaved(false);
    setChild(kind);
  };
  useLayoutEffect(() => {
    if (!child && opener.current?.isConnected && !opener.current.closest('[hidden]')) {
      opener.current.focus({ preventScroll: true });
    }
  }, [child]);
  const organizer = scenario !== 'denied';
  const [guard, setGuard] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generation, setGeneration] = useState(0);
  const requestBack = () => window.dispatchEvent(new Event('settings-request-close'));
  const backToInfo = () => {
    setGuard(false);
    setChild(null);
  };
  const session = {
    user: { id: organizer ? 'lena' : 'misha', displayName: organizer ? 'Лена' : 'Миша' },
    expiresAt: '2027-01-01T00:00:00Z',
    csrf: null,
  };
  const people =
    scenario === 'many'
      ? [
          ...peopleSeed,
          ...Array.from({ length: 21 }, (_, index) => ({
            user: {
              id: 'guest-' + index,
              displayName:
                ['Тимофей', 'Александра', 'Марина', 'Константин'][index % 4] +
                ' ' +
                (index + 1),
            },
            role: 'guest' as const,
            answer: 'going' as const,
            revision: '1',
          })),
        ]
      : peopleSeed;
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== parent || event.data?.type !== 'settings-preview-state') {
        return;
      }
      const next = event.data.value;
      setScenario(next);
      setOpen(true);
      setChild('settings');
      setGuard(false);
      setSaved(false);
      setGeneration((value) => value + 1);
      setMeeting(meetingFor(next));
      setAnswer('going');
      setBusy(false);
      setResponseError(false);
      setRosterError(next === 'roster-error');
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, []);
  useEffect(() => {
    if (scenario === 'roster-error') {
      setRosterError(true);
    }
    if (scenario === 'no-cover') {
      setMeeting((value) => ({ ...value, coverUrl: null }));
    }
    if (scenario === 'no-time') {
      setMeeting((value) => ({ ...value, startsAt: null }));
    }
  }, []);
  const respond = (next: Answer, onSuccess?: () => void) => {
    if (busy) {
      return;
    }
    setBusy(true);
    setResponseError(false);
    window.setTimeout(() => {
      setBusy(false);
      if (scenario === 'response-error') {
        setResponseError(true);
        setScenario('member');
        return;
      }
      setAnswer(next);
      onSuccess?.();
      if (next !== 'going') {
        setChild(null);
        setOpen(false);
      }
    }, 450);
  };
  const bindChat = (event: SyntheticEvent<HTMLIFrameElement>) => {
    const doc = event.currentTarget.contentDocument;
    doc?.addEventListener(
      'click',
      (e) => {
        const target = (e.target as Element).closest('button');
        if (
          target
            ?.getAttribute('aria-label')
            ?.match(/Информация о встрече|Сведения о встрече/)
        ) {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }
      },
      true,
    );
  };
  return {
    scenario,
    setScenario,
    open,
    setOpen,
    child,
    setChild,
    meeting,
    setMeeting,
    answer,
    busy,
    responseError,
    respond,
    rosterError,
    setRosterError,
    people,
    organizer,
    session,
    bindChat,
    showChild,
    guard,
    setGuard,
    saved,
    setSaved,
    generation,
    requestBack,
    backToInfo,
  };
};
