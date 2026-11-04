import { useEffect, useId } from 'react';
import type { RefObject, SyntheticEvent } from 'react';
import { useBackdropDismiss } from '@/shared/ui/Dialog/hooks/useBackdropDismiss';
import { dialogHasBusyAction } from '@/shared/ui/Dialog/hooks/useDialogBusy';
import { useSheetDismiss } from '@/shared/ui/Dialog/hooks/useSheetDismiss';

export const useDialogControls = (
  ref: RefObject<HTMLDialogElement | null>,
  onClose: () => void,
  dismissible: boolean,
  inline: boolean,
  open: boolean,
) => {
  useEffect(() => {
    if (!inline || !open) {
      return;
    }

    const escape = (event: KeyboardEvent) => {
      if (
        event.key === 'Escape' &&
        !event.defaultPrevented &&
        dismissible &&
        !dialogHasBusyAction(ref.current) &&
        !document.querySelector('dialog:modal, .g-popup_open')
      ) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', escape);

    return () => document.removeEventListener('keydown', escape);
  }, [inline, open, dismissible, onClose, ref]);
  const dismiss = () => {
    if (dismissible && !dialogHasBusyAction(ref.current)) {
      onClose();
    }
  };

  const swipe = useSheetDismiss(ref, dismiss, dismissible);
  const heading = useId();
  const backdrop = useBackdropDismiss(dismiss);

  return {
    region: {
      onClickCapture: swipe.click,
      onPointerDown: swipe.start,
      onPointerMove: swipe.move,
      onPointerUp: swipe.end,
      onPointerCancel: swipe.cancel,
      onLostPointerCapture: swipe.cancel,
    },
    heading,
    backdrop,
    dismiss,
    cancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      if (event.target !== event.currentTarget) {
        return;
      }

      event.preventDefault();
      dismiss();
    },
  };
};
