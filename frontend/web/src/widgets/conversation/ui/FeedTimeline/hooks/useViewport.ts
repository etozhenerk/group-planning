import { useLayoutEffect, useRef, useState } from 'react';
import type { FeedEntry } from '@/entities/meeting';

export const useViewport = (
  entries: FeedEntry[],
  loadOlder: () => Promise<boolean | undefined>,
) => {
  const ref = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const first = useRef(true);
  const history = useRef<{
    height: number;
    top: number;
    first: string | undefined;
  } | null>(null);

  const [unread, setUnread] = useState(false);
  const firstId = entries[0]?.id;
  const lastId = entries.at(-1)?.id;
  useLayoutEffect(() => {
    const view = ref.current;

    if (!view) {
      return;
    }

    if (history.current && history.current.first !== firstId) {
      view.scrollTop = history.current.top + view.scrollHeight - history.current.height;
      history.current = null;
      nearBottom.current = false;
    } else if (first.current || nearBottom.current) {
      view.scrollTop = view.scrollHeight;
      first.current = false;
    } else {
      setUnread(true);
    }
  }, [firstId, lastId]);
  const scroll = () => {
    const view = ref.current;

    if (view) {
      nearBottom.current = view.scrollHeight - view.scrollTop - view.clientHeight < 100;

      if (nearBottom.current) {
        setUnread(false);
      }
    }
  };

  const latest = () => {
    const view = ref.current;

    if (view) {
      view.scrollTop = view.scrollHeight;
    }

    nearBottom.current = true;
    setUnread(false);
  };

  const older = async () => {
    const view = ref.current;

    if (view) {
      history.current = {
        height: view.scrollHeight,
        top: view.scrollTop,
        first: firstId,
      };
    }

    const loaded = await loadOlder();

    if (!loaded) {
      history.current = null;
    }
  };

  return { ref, scroll, latest, older, unread };
};
