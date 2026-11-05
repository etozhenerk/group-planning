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
  const day = selection[selection.period];
  const previous = useRef({ user, period: selection.period, day });

  useLayoutEffect(() => {
    const node = viewport.current;

    if (!mobile || !node) {
      return;
    }

    const state = readHomeScroll(user, selection.period);
    const changedDay =
      previous.current.user === user &&
      previous.current.period === selection.period &&
      previous.current.day !== day;

    previous.current = { user, period: selection.period, day };

    if (changedDay && selection.view === 'calendar') {
      state.positions.calendar = 0;
    }

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
  }, [user, selection.period, selection.view, day, mobile, ready]);

  return viewport;
};
