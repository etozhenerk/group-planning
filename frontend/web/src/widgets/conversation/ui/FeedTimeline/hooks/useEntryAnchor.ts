import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import type { FeedPosition } from '@/entities/meeting';

export const useEntryAnchor = (
  ref: RefObject<HTMLDivElement | null>,
  save: (position: FeedPosition) => unknown,
) => {
  const position = useRef<FeedPosition | null>(null);
  const writer = useRef(save);
  writer.current = save;
  const correcting = useRef(false);
  const capture = useCallback(
    (following: boolean, focusedId: string | null) => {
      const view = ref.current;

      if (!view) {
        return;
      }

      const top = view.getBoundingClientRect().top;
      const row = [...view.querySelectorAll<HTMLElement>('[data-entry-id]')].find(
        (element) =>
          element.dataset.protected !== 'true' &&
          element.getBoundingClientRect().bottom > top &&
          element.getBoundingClientRect().top < view.getBoundingClientRect().bottom,
      );

      if (!row) {
        return;
      }

      const next = {
        entryId: row?.dataset.entryId ?? null,
        offset: (row?.getBoundingClientRect().top ?? top) - top,
        following,
        focusedId,
      };

      position.current = next;
      writer.current(next);
    },
    [ref],
  );

  const restore = useCallback(
    (following: boolean) => {
      const saved = position.current;
      const view = ref.current;

      if (following || !saved?.entryId || !view) {
        return;
      }

      const row = view.querySelector<HTMLElement>(
        `[data-entry-id="${CSS.escape(saved.entryId)}"]`,
      );

      if (!row) {
        return;
      }

      const delta =
        row.getBoundingClientRect().top - view.getBoundingClientRect().top - saved.offset;

      if (Math.abs(delta) > 0.1) {
        correcting.current = true;
        view.scrollTop += delta;
        requestAnimationFrame(() => {
          correcting.current = false;
        });
      }
    },
    [ref],
  );

  return { capture, restore, correcting };
};
