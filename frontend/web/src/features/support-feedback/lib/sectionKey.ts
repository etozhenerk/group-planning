import type { KeyboardEvent } from 'react';

export const sectionKey = (event: KeyboardEvent<HTMLInputElement>, apply: () => void) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    apply();

    return;
  }

  if (
    !['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(
      event.key,
    )
  ) {
    return;
  }

  event.preventDefault();
  const inputs = Array.from(
    event.currentTarget
      .closest('[role="radiogroup"]')
      ?.querySelectorAll<HTMLInputElement>('input') ?? [],
  );

  const step = ['ArrowUp', 'ArrowLeft'].includes(event.key) ? -1 : 1;
  const next =
    event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? inputs.length - 1
        : (inputs.indexOf(event.currentTarget) + step + inputs.length) % inputs.length;

  inputs[next]?.focus();
};
