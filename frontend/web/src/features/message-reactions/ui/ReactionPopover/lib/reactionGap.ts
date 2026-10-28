import { designTokens } from '@/shared/config/design-tokens';

export const reactionGap = (anchor: HTMLElement | null, placement: string) => {
  const gap = Number.parseFloat(designTokens.componentReactionPickerAnchorGap);

  if (!placement.startsWith('bottom')) {
    return gap;
  }

  const bottom = anchor?.getBoundingClientRect().bottom ?? 0;
  const chips = anchor?.parentElement?.querySelectorAll('[data-reaction-chip]');
  const extra = Math.max(
    0,
    ...Array.from(chips ?? [], (chip) => chip.getBoundingClientRect().bottom - bottom),
  );

  return gap + extra;
};
