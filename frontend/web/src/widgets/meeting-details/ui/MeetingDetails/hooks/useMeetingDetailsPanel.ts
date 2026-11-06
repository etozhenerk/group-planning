import type { MouseEvent } from 'react';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePanelHistory } from '@/shared/lib/panel-history';

export const useMeetingDetailsPanel = (meeting: string, user: string, title: string) => {
  const history = usePanelHistory(`meeting-info:${user}:${meeting}`, [
    'info',
    'settings',
    'share',
    'response',
  ]);

  const info = useRef<HTMLDivElement>(null);
  const settings = useRef<HTMLDivElement>(null);
  const share = useRef<HTMLDivElement>(null);
  const response = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const previous = useRef(history.panel);
  const settingsClose = useRef<(() => boolean) | null>(null);
  const [settingsTitle, setSettingsTitle] = useState('Настройки встречи');
  const [savedNotice, setSavedNotice] = useState(false);
  const registerClose = useCallback((handler: (() => boolean) | null) => {
    settingsClose.current = handler;
  }, []);

  const [visited, setVisited] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (history.panel === 'settings') {
      setVisited(true);
    }
  }, [history.panel]);
  useLayoutEffect(() => {
    if (previous.current && previous.current !== history.panel && history.panel) {
      const container = { info, settings, share, response }[history.panel].current;
      const target = history.panel === 'info' ? origin.current : container;

      if (target?.isConnected && !target.closest('[hidden]')) {
        target.focus({ preventScroll: true });
      }
    }

    previous.current = history.panel;
  }, [history.panel]);

  const openChild = (
    panel: 'settings' | 'share' | 'response',
    opener: HTMLButtonElement,
  ) => {
    origin.current = opener;
    setSavedNotice(false);

    history.show(panel);
  };

  return {
    ...history,
    title:
      history.panel === 'settings'
        ? settingsTitle
        : history.panel === 'share'
          ? 'Пригласить друзей'
          : history.panel === 'response'
            ? 'Изменить ответ'
            : title,
    info,
    settings,
    share,
    response,
    visited,
    savedNotice,
    registerClose,
    setSettingsTitle,
    close: () => {
      if (
        history.panel === 'settings' &&
        settingsClose.current &&
        !settingsClose.current()
      ) {
        return;
      }

      history.close();
    },
    discarded: (navigating: boolean) => {
      setGeneration((value) => value + 1);

      if (!navigating) {
        history.close();
      }
    },
    generation,
    edit: (event: MouseEvent<HTMLButtonElement>) =>
      openChild('settings', event.currentTarget),
    shareAction: (event: MouseEvent<HTMLButtonElement>) =>
      openChild('share', event.currentTarget),
    responseAction: (event: MouseEvent<HTMLButtonElement>) =>
      openChild('response', event.currentTarget),
    saved: () => {
      setSavedNotice(true);
      setGeneration((value) => value + 1);

      if (history.panel === 'settings') {
        history.close();
      }
    },
  };
};
