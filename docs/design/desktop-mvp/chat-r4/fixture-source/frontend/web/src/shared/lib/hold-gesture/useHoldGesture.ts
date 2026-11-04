import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';
import { designTokens } from '@/shared/config/design-tokens';
import { createHoldGesture } from '@/shared/lib/hold-gesture/createHoldGesture';

export const useHoldGesture = <T extends HTMLElement>(
  enabled: boolean,
  open: () => void,
  keyboardActivate = false,
) => {
  const callback = useRef(open);
  const [pressed, setPressed] = useState(false);
  const [gesture] = useState(() =>
    createHoldGesture(
      () => callback.current(),
      setPressed,
      Number.parseFloat(designTokens.motionDurationReactionLongPress),
      Number.parseFloat(designTokens.componentReactionPickerLongPressMovementTolerance),
    ),
  );

  useLayoutEffect(() => {
    callback.current = open;
  }, [open]);
  useEffect(() => {
    document.addEventListener('scroll', gesture.cancel, true);

    return () => {
      document.removeEventListener('scroll', gesture.cancel, true);
      gesture.cancel();
    };
  }, [gesture]);
  const nestedControl = (target: EventTarget, current: HTMLElement) =>
    target instanceof Element &&
    target.closest('button, a, input, textarea') !== null &&
    target.closest('button, a, input, textarea') !== current;

  return {
    pressed,
    events: {
      onPointerDown: (event: PointerEvent<T>) => {
        gesture.resetClick();

        if (
          enabled &&
          event.pointerType !== 'mouse' &&
          !nestedControl(event.target, event.currentTarget)
        ) {
          gesture.start(event.clientX, event.clientY);
        }
      },
      onPointerMove: (event: PointerEvent<T>) =>
        gesture.move(event.clientX, event.clientY),
      onPointerUp: gesture.cancel,
      onPointerCancel: gesture.cancel,
      onPointerLeave: gesture.cancel,
      onClickCapture: (event: MouseEvent<T>) => {
        if (gesture.consumeClick()) {
          event.preventDefault();
          event.stopPropagation();
        }
      },
      onContextMenu: (event: MouseEvent<T>) => {
        if (enabled && !nestedControl(event.target, event.currentTarget)) {
          event.preventDefault();
          event.currentTarget.focus({ preventScroll: true });
          gesture.activate();
        }
      },
      onKeyDown: (event: KeyboardEvent<T>) => {
        if (!enabled || event.target !== event.currentTarget) {
          return;
        }

        if (
          event.key === 'ContextMenu' ||
          (event.shiftKey && event.key === 'F10') ||
          (keyboardActivate && (event.key === 'Enter' || event.key === ' '))
        ) {
          event.preventDefault();
          gesture.resetClick();
          gesture.activate();
        }
      },
    },
  };
};
