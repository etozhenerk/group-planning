import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { animateDialog } from '@/shared/ui/Dialog/lib/dialogMotion';
import { lockBackgroundScroll } from '@/shared/lib/lockBackgroundScroll';
import { useVisualViewport } from '@/shared/lib/viewport';

export const useDialog = (open: boolean, children: ReactNode) => {
  const ref = useRef<HTMLDialogElement>(null);
  useVisualViewport(ref);
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
      if (!dialog.open) {
        const previous = document.activeElement;
        const unlock = lockBackgroundScroll(dialog);
        dialog.showModal();
        release.current = () => {
          unlock();

          if (
            previous instanceof HTMLElement &&
            previous.isConnected &&
            !document.querySelector('dialog[open]')
          ) {
            previous.focus({ preventScroll: true });
          }
        };
      }

      return animateDialog(dialog, true, () => {
        dialog.dataset['motion'] = 'open';
      });
    }

    if (dialog.open) {
      return animateDialog(dialog, false, () => {
        finish();
        setRetained(null);
      });
    }
  }, [open, finish]);

  useEffect(() => finish, [finish]);

  return { ref, content: open ? children : (retained ?? children) };
};
