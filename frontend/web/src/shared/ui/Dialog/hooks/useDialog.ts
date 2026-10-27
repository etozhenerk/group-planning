import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode, RefObject } from 'react';
import { animateDialog } from '@/shared/ui/Dialog/lib/dialogMotion';
import { openAfterModalExit } from '@/shared/ui/Dialog/lib/openAfterModalExit';
import { lockBackgroundScroll } from '@/shared/lib/lockBackgroundScroll';
import { useVisualViewport } from '@/shared/lib/viewport';

export const useDialog = (
  open: boolean,
  children: ReactNode,
  modal = true,
  returnFocus?: RefObject<HTMLElement | null>,
) => {
  const ref = useRef<HTMLDialogElement>(null);
  useVisualViewport(ref);
  const wasModal = useRef(modal);
  const release = useRef<(() => void) | undefined>(undefined);
  const [retained, setRetained] = useState<ReactNode>(null);
  const finish = useCallback(() => {
    const dialog = ref.current;
    dialog?.close();
    dialog?.style.removeProperty('transform');
    dialog?.style.removeProperty('--backdrop-opacity');
    release.current?.();
    release.current = undefined;
  }, []);

  useLayoutEffect(() => {
    if (open) {
      setRetained(children);
    }
  }, [open, children]);

  useLayoutEffect(() => {
    const dialog = ref.current;

    if (!dialog) {
      return;
    }

    if (open) {
      if (dialog.open && wasModal.current !== modal) {
        finish();
      }

      wasModal.current = modal;

      return openAfterModalExit(dialog, () => {
        if (!dialog.open) {
          const previous = document.activeElement;
          const unlock = modal ? lockBackgroundScroll(dialog) : () => undefined;

          if (modal) {
            dialog.showModal();
          } else {
            dialog.show();
          }

          release.current = () => {
            unlock();
            const target = returnFocus?.current ?? previous;

            if (
              target instanceof HTMLElement &&
              target.isConnected &&
              !document.querySelector('dialog[open]')
            ) {
              target.focus({ preventScroll: true });
            }
          };
        }

        if (!modal) {
          dialog.dataset['motion'] = 'open';

          return;
        }

        return animateDialog(dialog, true, () => {
          dialog.dataset['motion'] = 'open';
        });
      });
    }

    if (dialog.open) {
      if (!wasModal.current) {
        finish();
        setRetained(null);

        return;
      }

      return animateDialog(dialog, false, () => {
        finish();
        setRetained(null);
      });
    }
  }, [open, finish, modal, returnFocus]);

  useEffect(() => finish, [finish]);

  return { ref, content: open ? children : (retained ?? children) };
};
