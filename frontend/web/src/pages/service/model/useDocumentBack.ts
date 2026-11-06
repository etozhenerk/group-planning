import type { MouseEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { readReturnLocation } from '@/shared/lib/navigation';

export const useDocumentBack = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const back = readReturnLocation(location.state, '/profile');
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    const entry: unknown = history.state;

    if (
      entry &&
      typeof entry === 'object' &&
      'idx' in entry &&
      typeof entry.idx === 'number' &&
      entry.idx > 0
    ) {
      event.preventDefault();
      void navigate(-1);
    }
  };

  return { back, onClick };
};
