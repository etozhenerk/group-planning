import { useLayoutEffect, useRef } from 'react';
import { usePanelHistory } from '@/shared/lib/panel-history';

export const useTaskPanel = (owner: string) => {
  const history = usePanelHistory(owner, ['details', 'cancel', 'decline']);
  const opener = useRef<HTMLButtonElement>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const details = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const previous = useRef(history.panel);
  const current = useRef(history.panel);
  useLayoutEffect(() => {
    current.current = history.panel;

    if (previous.current && previous.current !== history.panel && history.panel) {
      const target =
        history.panel === 'details'
          ? origin.current?.isConnected
            ? origin.current
            : details.current
          : confirmation.current;

      target?.focus({ preventScroll: true });
    }

    previous.current = history.panel;
  }, [history.panel]);

  return {
    ...history,
    opener,
    confirmation,
    details,
    finish: () => {
      if (current.current === 'cancel' || current.current === 'decline') {
        history.close();
      }
    },
    confirm: (action: 'cancel' | 'decline', trigger: HTMLButtonElement) => {
      origin.current = trigger;

      if (!opener.current) {
        opener.current = trigger;
      }

      history.show(action);
    },
  };
};
