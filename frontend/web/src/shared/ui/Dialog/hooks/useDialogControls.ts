import { useEffect, useId } from 'react';
import type { RefObject, SyntheticEvent } from 'react';
import { useBackdropDismiss } from '@/shared/ui/Dialog/hooks/useBackdropDismiss';
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
        !document.querySelector('dialog:modal, .g-popup_open')
      ) {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', escape);

    return () => document.removeEventListener('keydown', escape);
  }, [inline, open, dismissible, onClose]);
  const dismiss = () => {
    if (dismissible) {
      onClose();
    }
  };

  const swipe = useSheetDismiss(ref, dismiss);
  const heading = useId();
  const backdrop = useBackdropDismiss(dismiss);

  return {
    swipe,
    heading,
    backdrop,
    dismiss,
    cancel: (event: SyntheticEvent<HTMLDialogElement>) => {
      event.preventDefault();
      dismiss();
    },
  };
};
