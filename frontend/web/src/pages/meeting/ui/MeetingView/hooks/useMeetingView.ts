import { useMeeting } from '@/entities/meeting';
import { useMediaQuery } from '@/shared/lib/media';
import { usePanelHistory } from '@/shared/lib/panel-history';
import { useRef } from 'react';

export const useMeetingView = (id: string, user: string) => {
  const query = useMeeting(id, user);
  const history = usePanelHistory(`meeting-info:${user}:${id}`, [
    'info',
    'settings',
    'share',
  ] as const);

  const details = {
    open: history.panel !== null,
    show: () => history.show('info'),
    close: history.close,
  };

  const detailsTrigger = useRef<HTMLButtonElement>(null);
  const wide = useMediaQuery('(min-width: 1101px)');
  let invitation: string | null = null;

  try {
    invitation = sessionStorage.getItem(`somewhere-invitation:${user}:${id}`);
  } catch {
    /* The original URL can still be opened manually. */
  }

  return { query, details, detailsTrigger, invitation, wide };
};
