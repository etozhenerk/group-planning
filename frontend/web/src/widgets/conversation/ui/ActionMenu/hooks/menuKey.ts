import type { KeyboardEvent } from 'react';

export const menuKey = (event: KeyboardEvent<HTMLDivElement>) => {
  if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
    return;
  }

  const items = [
    ...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="menuitem"]'),
  ];

  if (!items.length) {
    return;
  }

  const index = items.findIndex((item) => item === document.activeElement);
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : (index + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;

  event.preventDefault();
  items[next]?.focus();
};
