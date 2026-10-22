import { useEffect, useRef } from 'react';
import type { PointerEvent, RefObject } from 'react';
import { reducedDialogMotion } from '@/shared/ui/Dialog/lib/dialogMotion';

type Gesture = { id: number; y: number; lastY: number; time: number; speed: number };

export const useSheetDismiss = (
  ref: RefObject<HTMLDialogElement | null>,
  onClose: () => void,
) => {
  const gesture = useRef<Gesture | null>(null);
  const settling = useRef<Animation | null>(null);
  useEffect(() => () => settling.current?.cancel(), []);

  const reset = (dialog: HTMLDialogElement) => {
    const transform = getComputedStyle(dialog).transform;
    dialog.style.removeProperty('transform');
    dialog.style.removeProperty('--backdrop-opacity');
    dialog.dataset['dragging'] = 'false';
    settling.current = dialog.animate([{ transform }, { transform: 'translateY(0)' }], {
      duration: reducedDialogMotion() ? 0 : 220,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
    });
  };

  const start = (event: PointerEvent<HTMLDivElement>) => {
    const dialog = ref.current;

    if (
      !dialog ||
      dialog.dataset['motion'] !== 'open' ||
      !window.matchMedia('(max-width: 739px)').matches ||
      event.button !== 0 ||
      (event.target instanceof Element && event.target.closest('button'))
    ) {
      return;
    }

    settling.current?.cancel();
    gesture.current = {
      id: event.pointerId,
      y: event.clientY,
      lastY: event.clientY,
      time: event.timeStamp,
      speed: 0,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const move = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    const dialog = ref.current;

    if (!drag || drag.id !== event.pointerId || !dialog) {
      return;
    }

    const distance = Math.max(0, event.clientY - drag.y);
    drag.speed = (event.clientY - drag.lastY) / Math.max(1, event.timeStamp - drag.time);
    drag.lastY = event.clientY;
    drag.time = event.timeStamp;
    dialog.dataset['dragging'] = 'true';
    dialog.style.transform = `translateY(${distance}px)`;
    dialog.style.setProperty(
      '--backdrop-opacity',
      String(1 - Math.min(distance / dialog.offsetHeight, 0.65)),
    );
  };

  const end = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = gesture.current;
    const dialog = ref.current;

    if (!drag || drag.id !== event.pointerId || !dialog) {
      return;
    }

    gesture.current = null;
    const distance = Math.max(0, event.clientY - drag.y);
    const fast = event.timeStamp - drag.time < 100 && drag.speed > 0.65 && distance > 24;

    if (!cancelled && (distance > Math.min(120, dialog.offsetHeight * 0.22) || fast)) {
      dialog.dataset['dragging'] = 'false';
      onClose();
    } else {
      reset(dialog);
    }
  };

  return {
    start,
    move,
    end,
    cancel: (event: PointerEvent<HTMLDivElement>) => end(event, true),
  };
};
