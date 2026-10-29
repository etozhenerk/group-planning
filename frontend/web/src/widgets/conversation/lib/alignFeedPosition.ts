import type { FeedPosition } from '@/entities/meeting';

export const alignFeedPosition = (
  view: HTMLElement | null,
  position: FeedPosition | null | undefined,
) => {
  if (!view || !position?.entryId || position.following) {
    return false;
  }

  const row = view.querySelector<HTMLElement>(
    `[data-entry-id="${CSS.escape(position.entryId)}"]`,
  );

  if (!row) {
    return false;
  }

  const delta =
    row.getBoundingClientRect().top - view.getBoundingClientRect().top - position.offset;

  if (Math.abs(delta) > 0.1) {
    view.scrollTop += delta;
  }

  return true;
};
