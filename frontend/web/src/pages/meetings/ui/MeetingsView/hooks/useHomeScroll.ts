import { useLayoutEffect, useRef } from 'react';
import { readHomeScroll, saveHomeScroll } from '@/pages/meetings/model/homeScroll';
import type { HomeSelection } from '@/pages/meetings/model/selection';

export const useHomeScroll = (
  user: string,
  selection: HomeSelection,
  mobile: boolean,
  ready: boolean,
) => {
  const viewport = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const node = viewport.current;

    if (!mobile || !node) {
      return;
    }

    const state = readHomeScroll(user, selection.period);
    node.scrollTop = state.positions[selection.view];

    // Loading skeletons must not replace a saved offset with a clamped zero.
    if (!ready) {
      return;
    }

    const save = () => {
      state.positions[selection.view] = node.scrollTop;
      saveHomeScroll(user, state);
    };

    node.addEventListener('scroll', save, { passive: true });

    return () => {
      // The next view can clamp the DOM offset before layout-effect cleanup.
      // Persist the last observed position, not the replacement view's geometry.
      saveHomeScroll(user, state);
      node.removeEventListener('scroll', save);
    };
  }, [user, selection.period, selection.view, mobile, ready]);

  return viewport;
};
