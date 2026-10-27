import { useCallback, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { FeedEntry } from '@/entities/meeting';
import type { useConversation } from '@/entities/meeting';
import { useViewportResize } from '@/widgets/conversation/ui/FeedTimeline/hooks/useViewportResize';
import { useEntryAnchor } from '@/widgets/conversation/ui/FeedTimeline/hooks/useEntryAnchor';
import { useVirtualFeed } from '@/widgets/conversation/ui/FeedTimeline/hooks/useVirtualFeed';

export const useViewport = (
  entries: FeedEntry[],
  query: ReturnType<typeof useConversation>,
  ref: RefObject<HTMLDivElement | null>,
  user: string,
) => {
  const initial = useRef(query.position());
  const [following, setFollowing] = useState(initial.current?.following ?? true);
  const [unread, setUnread] = useState(false);
  const hidden = new Set(query.data?.protectedEntries?.map((entry) => entry.id) ?? []);

  if (query.data?.window?.hasNewer) {
    for (const entry of entries) {
      if (entry.delivery) {
        hidden.add(entry.id);
      }
    }
  }

  const feed = useVirtualFeed(
    entries,
    user,
    ref,
    hidden,
    following && !query.data?.window?.hasNewer,
  );

  const restored = useRef<string | undefined>(undefined);
  const restoring = useRef(false);
  const scrolling = useRef(false);
  const scrollFrame = useRef<number | undefined>(undefined);
  const previousTail = useRef<string | undefined>(undefined);
  const state = useRef({ query, following, focused: feed.focused });
  state.current = { query, following, focused: feed.focused };
  const {
    capture: captureAnchor,
    restore: restoreAnchor,
    correcting,
  } = useEntryAnchor(ref, query.savePosition);

  const capture = useCallback(
    (follow = state.current.following) => {
      captureAnchor(follow, state.current.focused);
    },
    [captureAnchor],
  );

  useViewportResize(ref, entries, {
    restoring,
    scrolling,
    state,
    correcting,
    virtual: feed.virtual,
    restoreAnchor,
  });
  const prefetch = useCallback(() => {
    const query = state.current.query;
    const view = ref.current;

    if (!view || restoring.current || scrolling.current) {
      return;
    }

    if (
      query.data?.hasOlder &&
      view.scrollTop < view.clientHeight * 2 &&
      !query.historyError
    ) {
      void query.loadOlder();
    }

    if (
      query.data?.window?.hasNewer &&
      view.scrollHeight - view.scrollTop - view.clientHeight < view.clientHeight * 2 &&
      !query.newerError
    ) {
      void query.loadNewer();
    }
  }, [ref]);

  const windowId = query.data?.window?.id;
  useLayoutEffect(() => {
    const window = windowId;

    if (!window || restored.current === window || !entries.length || !ref.current) {
      return;
    }

    restored.current = window;
    restoring.current = true;
    const position = state.current.query.position() ?? initial.current;
    const index = entries.findIndex((entry) => entry.id === position?.entryId);
    setFollowing(position?.following ?? true);

    if (!position || position.following || index < 0) {
      feed.virtual.scrollToEnd();
    } else {
      feed.virtual.scrollToIndex(index, { align: 'start' });
    }

    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        if (restored.current !== window) {
          return;
        }

        if (position && !position.following && index >= 0) {
          const row = ref.current?.querySelector<HTMLElement>(
            `[data-entry-id="${CSS.escape(position.entryId!)}"]`,
          );

          const view = ref.current;

          if (row && view) {
            view.scrollTop +=
              row.getBoundingClientRect().top -
              view.getBoundingClientRect().top -
              position.offset;
          }
        }

        restoring.current = false;
        capture();
        prefetch();
      }),
    );
  }, [entries, windowId, ref, feed.virtual, capture, prefetch]);
  useLayoutEffect(() => {
    const query = state.current.query;
    const last = query.data?.entries.at(-1)?.id;

    if (previousTail.current && last !== previousTail.current && !following) {
      setUnread(true);
    }

    previousTail.current = last;

    if (following) {
      setUnread(false);

      if (query.data?.newMessages) {
        query.clearNewMessages();
      }
    }

    prefetch();
  }, [entries, following, prefetch]);
  useLayoutEffect(() => {
    capture();
  }, [feed.focused, capture]);
  const scroll = () => {
    if (restoring.current || correcting.current || !ref.current) {
      return;
    }

    const view = ref.current;
    const near =
      !query.data?.window?.hasNewer &&
      view.scrollHeight - view.scrollTop - view.clientHeight <= 64;

    scrolling.current = true;
    setFollowing(near);

    if (near) {
      setUnread(false);
    }

    if (scrollFrame.current !== undefined) {
      cancelAnimationFrame(scrollFrame.current);
    }

    scrollFrame.current = requestAnimationFrame(() => {
      capture(near);
      scrolling.current = false;
      prefetch();
    });
  };

  const latest = async () => {
    const previous = query.position();
    query.savePosition({
      entryId: null,
      offset: 0,
      following: true,
      focusedId: feed.focused,
    });

    if (query.data?.window?.hasNewer && !(await query.loadLatest())) {
      if (previous) {
        query.savePosition(previous);
      }

      return;
    }

    setFollowing(true);
    query.clearNewMessages();
    setUnread(false);
    feed.virtual.scrollToEnd();
  };

  return {
    ...feed,
    ref,
    hidden,
    scroll,
    capture,
    latest,
    older: () => {
      capture();

      return query.loadOlder();
    },
    unread: unread || !!query.data?.window?.hasNewer,
    following,
  };
};
