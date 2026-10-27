import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import { defaultRangeExtractor, useVirtualizer } from '@tanstack/react-virtual';
import type { RefObject } from 'react';
import type { FeedEntry } from '@/entities/meeting';
import { feedKey } from '@/widgets/conversation/lib/feedKey';

export const useVirtualFeed = (
  entries: FeedEntry[],
  user: string,
  ref: RefObject<HTMLDivElement | null>,
  hidden: Set<string>,
  following: boolean,
) => {
  const list = useRef<HTMLDivElement>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const [margin, setMargin] = useState(0);
  const measuredMargin = useRef<number | null>(null);
  const rangeExtractor = useCallback(
    (range: Parameters<typeof defaultRangeExtractor>[0]) => {
      const visible = defaultRangeExtractor(range).slice(0, 200);
      const retained = entries.flatMap((entry, index) =>
        entry.id === focused || entry.delivery ? [index] : [],
      );

      return [...new Set([...visible, ...retained])].sort((a, b) => a - b);
    },
    [entries, focused],
  );

  const virtual = useVirtualizer({
    count: entries.length,
    getScrollElement: () => ref.current,
    estimateSize: (index) => (hidden.has(entries[index]!.id) ? 0 : 128),
    getItemKey: (index) => feedKey(entries[index]!, user),
    overscan: 10,
    rangeExtractor,
    scrollMargin: margin,
    anchorTo: 'end',
    followOnAppend: following ? 'auto' : false,
    scrollEndThreshold: following ? 64 : -1,
    measureElement: (element) =>
      element.getAttribute('data-protected') === 'true'
        ? 0
        : element.getBoundingClientRect().height,
  });

  virtual.shouldAdjustScrollPositionOnItemSizeChange = (item, _delta, instance) =>
    item.end <= (instance.scrollOffset ?? 0);
  useLayoutEffect(() => {
    for (const item of virtual.getVirtualItems()) {
      const element = virtual.elementsCache.get(item.key);

      if (element) {
        virtual.resizeItem(
          item.index,
          hidden.has(entries[item.index]!.id)
            ? 0
            : element.getBoundingClientRect().height,
        );
      }
    }
  }, [virtual, entries, hidden]);
  const updateMargin = useCallback(() => {
    const view = ref.current;
    const content = list.current;

    if (!view || !content) {
      return;
    }

    const next =
      content.getBoundingClientRect().top -
      view.getBoundingClientRect().top +
      view.scrollTop;

    const previous = measuredMargin.current;
    measuredMargin.current = next;

    if (previous !== null && previous !== next) {
      view.scrollTop += next - previous;
    }

    setMargin(next);
  }, [ref]);

  useLayoutEffect(() => {
    updateMargin();
  });
  useLayoutEffect(() => {
    const view = ref.current;

    if (!view || !list.current) {
      return;
    }

    const observer = new ResizeObserver(updateMargin);
    observer.observe(view);

    for (const child of view.children) {
      observer.observe(child);
    }

    return () => observer.disconnect();
  }, [ref, entries.length, updateMargin]);

  return { virtual, list, margin, focused, setFocused };
};
