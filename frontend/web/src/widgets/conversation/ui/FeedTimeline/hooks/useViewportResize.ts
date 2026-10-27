import { useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { FeedEntry } from '@/entities/meeting';

type Options = {
  restoring: RefObject<boolean>;
  scrolling: RefObject<boolean>;
  state: RefObject<{ following: boolean }>;
  correcting: RefObject<boolean>;
  virtual: { scrollToEnd: () => void };
  restoreAnchor: (following: boolean) => void;
};

export const useViewportResize = (
  ref: RefObject<HTMLDivElement | null>,
  entries: FeedEntry[],
  options: Options,
) => {
  const latest = useRef(options);
  latest.current = options;
  const following = options.state.current.following;
  useLayoutEffect(() => {
    const restore = () => {
      const { restoring, scrolling, state, restoreAnchor } = latest.current;

      if (!restoring.current && !scrolling.current) {
        restoreAnchor(state.current.following);
      }
    };

    restore();
    const frame = requestAnimationFrame(restore);

    return () => cancelAnimationFrame(frame);
  }, [entries, following]);
  useLayoutEffect(() => {
    const view = ref.current;

    if (!view) {
      return;
    }

    let frame: number | undefined;
    const observer = new ResizeObserver(() => {
      const { restoring, scrolling, state, correcting, virtual, restoreAnchor } =
        latest.current;

      if (restoring.current || scrolling.current) {
        return;
      }

      if (state.current.following) {
        correcting.current = true;
        virtual.scrollToEnd();
        frame = requestAnimationFrame(() => {
          correcting.current = false;
        });
      } else {
        restoreAnchor(false);
      }
    });

    observer.observe(view);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame ?? 0);
    };
  }, [ref, entries.length]);
};
