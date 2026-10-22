import { useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';

export const useBackdropDismiss = (onClose: () => void) => {
  const startedOutside = useRef(false);
  const outside = (event: MouseEvent<HTMLDialogElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();

    return (
      event.target === event.currentTarget &&
      (event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom)
    );
  };

  const pointerDown = (event: PointerEvent<HTMLDialogElement>) => {
    startedOutside.current = outside(event);
  };

  const click = (event: MouseEvent<HTMLDialogElement>) => {
    if (startedOutside.current && outside(event)) {
      onClose();
    }

    startedOutside.current = false;
  };

  return { pointerDown, click };
};
