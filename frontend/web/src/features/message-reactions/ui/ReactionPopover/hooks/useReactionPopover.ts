import {
  useFloating,
  offset,
  flip,
  shift,
  autoUpdate,
  useDismiss,
  useRole,
  useInteractions,
  size,
  useTransitionStyles,
} from '@floating-ui/react';
import { useCallback, useLayoutEffect, useRef } from 'react';
import type { RefObject } from 'react';
import { designTokens } from '@/shared/config/design-tokens';
import { reactionGap } from '@/features/message-reactions/ui/ReactionPopover/lib/reactionGap';
import { useMediaQuery } from '@/shared/lib/media';

export const useReactionPopover = (
  open: boolean,
  close: (value: boolean) => void,
  anchor: RefObject<HTMLElement | null>,
  boundary: RefObject<HTMLElement | null>,
) => {
  const reduced = useMediaQuery('(prefers-reduced-motion: reduce)');
  const bounds = () => ({
    boundary: boundary.current ?? ('clippingAncestors' as const),
    padding: Number.parseFloat(designTokens.componentReactionPickerEdgeInset),
  });

  const floating = useFloating({
    open,
    onOpenChange: close,
    placement: 'top',
    strategy: 'fixed',
    middleware: [
      offset(({ placement }) => reactionGap(anchor.current, placement)),
      flip(bounds),
      shift(({ elements }) => ({
        ...bounds(),
        crossAxis: elements.floating.querySelector('[data-reaction-expanded]') !== null,
      })),
      size(() => ({
        ...bounds(),
        apply: ({ availableWidth, availableHeight, elements }) => {
          elements.floating.style.setProperty(
            '--reaction-available-width',
            `${Math.max(0, availableWidth)}px`,
          );
          elements.floating.style.setProperty(
            '--reaction-available-height',
            `${Math.max(0, availableHeight)}px`,
          );
        },
      })),
    ],
    whileElementsMounted: autoUpdate,
  });

  const refs = floating.refs;
  const update = floating.update;
  const registeredAnchor = useRef<HTMLElement | null>(null);
  const setFloating = useCallback(
    (element: HTMLDivElement | null) => refs.setFloating(element),
    [refs],
  );

  const resize = useCallback(() => {
    // Measure the new content before flip reuses the previous panel's height limit.
    refs.floating.current?.style.removeProperty('--reaction-available-height');
    update();
  }, [refs, update]);

  useLayoutEffect(() => {
    const element = anchor.current;

    if (registeredAnchor.current !== element) {
      registeredAnchor.current = element;
      refs.setReference(element);
    }
  });

  useLayoutEffect(() => {
    if (open) {
      update();
    }
  }, [open, update]);

  const inside = () => [
    ...Array.from(
      anchor.current?.parentElement?.querySelectorAll('[data-reaction-chip]') ?? [],
    ),
    ...Array.from(document.querySelectorAll('[data-chat-surface-trigger]')),
  ];

  const dismiss = useDismiss(floating.context, {
    outsidePress: (event) => {
      const target = event.target;

      return !(target instanceof Node && inside().some((chip) => chip.contains(target)));
    },
  });

  const role = useRole(floating.context, { role: 'dialog' });
  const interactions = useInteractions([dismiss, role]);

  const away = {
    opacity: 0,
    transform: reduced
      ? 'none'
      : `translateY(${designTokens.componentReactionPickerEnterOffset}) scale(${designTokens.componentReactionPickerEnterScale})`,
  };

  const transition = useTransitionStyles(floating.context, {
    duration: reduced
      ? 0
      : {
          open: Number.parseFloat(designTokens.motionDurationReactionEnter),
          close: Number.parseFloat(designTokens.motionDurationReactionExit),
        },
    initial: away,
    close: away,
    open: { opacity: 1, transform: 'none' },
    common: { transitionTimingFunction: designTokens.motionEasingStandard },
  });

  return { ...floating, ...interactions, transition, inside, resize, setFloating };
};
