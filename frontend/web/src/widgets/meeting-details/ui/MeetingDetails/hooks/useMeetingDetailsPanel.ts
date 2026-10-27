import type { MouseEvent } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { usePanelHistory } from '@/shared/lib/panel-history';

export const useMeetingDetailsPanel = (meeting: string, user: string, title: string) => {
  const history = usePanelHistory(`meeting-info:${user}:${meeting}`, [
    'info',
    'settings',
    'share',
  ]);

  const info = useRef<HTMLDivElement>(null);
  const settings = useRef<HTMLDivElement>(null);
  const share = useRef<HTMLDivElement>(null);
  const origin = useRef<HTMLElement | null>(null);
  const previous = useRef(history.panel);
  const [visited, setVisited] = useState(false);
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (history.panel === 'settings') {
      setVisited(true);
    }
  }, [history.panel]);
  useLayoutEffect(() => {
    if (previous.current && previous.current !== history.panel && history.panel) {
      const container = { info, settings, share }[history.panel].current;
      const target = history.panel === 'info' ? origin.current : container;

      if (target?.isConnected && !target.closest('[hidden]')) {
        target.focus({ preventScroll: true });
      }
    }

    previous.current = history.panel;
  }, [history.panel]);

  const openChild = (panel: 'settings' | 'share', opener: HTMLButtonElement) => {
    origin.current = opener;
    history.show(panel);
  };

  return {
    ...history,
    title:
      history.panel === 'settings'
        ? 'Настройки встречи'
        : history.panel === 'share'
          ? 'Пригласить друзей'
          : title,
    info,
    settings,
    share,
    visited,
    generation,
    edit: (event: MouseEvent<HTMLButtonElement>) =>
      openChild('settings', event.currentTarget),
    shareAction: (event: MouseEvent<HTMLButtonElement>) =>
      openChild('share', event.currentTarget),
    saved: () => {
      setGeneration((value) => value + 1);

      if (history.panel === 'settings') {
        history.close();
      }
    },
  };
};
