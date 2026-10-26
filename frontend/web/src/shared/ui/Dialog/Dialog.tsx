import styles from '@/shared/ui/Dialog/Dialog.module.css';
import type { ReactNode } from 'react';
import { ChevronLeft, X } from 'lucide-react';
import { useDialogLayout } from '@/shared/ui/Dialog/hooks/useDialogLayout';
import { PortalProvider, DefaultPropsProvider } from '@gravity-ui/uikit';
import { popupDefaults } from '@/shared/ui/Dialog/lib/popupDefaults';
import { preservePopupEscape } from '@/shared/ui/Dialog/lib/preservePopupEscape';
import { useDialog } from '@/shared/ui/Dialog/hooks/useDialog';
import { useDialogControls } from '@/shared/ui/Dialog/hooks/useDialogControls';

export type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  contained?: boolean;
  dismissible?: boolean;
  desktopPage?: boolean;
  chatAction?: boolean;
};

export const Dialog = ({
  open,
  title,
  onClose,
  children,
  contained = false,
  dismissible = true,
  desktopPage = false,
  chatAction = false,
}: DialogProps) => {
  const { inline, tablet } = useDialogLayout(desktopPage);
  const dialog = useDialog(open, children, !inline);
  const { swipe, heading, backdrop, dismiss, cancel } = useDialogControls(
    dialog.ref,
    onClose,
    dismissible,
    inline,
    open,
  );

  return (
    <dialog
      className={[
        styles['dialog'],
        contained ? styles['contained'] : '',
        inline ? styles.page : '',
        tablet ? styles.tablet : '',
        desktopPage ? styles.action : '',
        chatAction ? styles['chat-action'] : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onPointerDown={backdrop.pointerDown}
      onClick={backdrop.click}
      ref={dialog.ref}
      role={inline ? 'main' : undefined}
      aria-labelledby={heading}
      id={inline && open ? 'main' : undefined}
      onCancel={cancel}
      onKeyDownCapture={preservePopupEscape}
    >
      <div
        className={styles['drag-region']}
        onPointerDown={swipe.start}
        onPointerMove={swipe.move}
        onPointerUp={swipe.end}
        onPointerCancel={swipe.cancel}
        onLostPointerCapture={swipe.cancel}
        data-testid="dialog-drag-region"
      >
        <div className={styles['dialog-heading']}>
          <h2 id={heading} aria-level={inline ? 1 : 2}>
            {title}
          </h2>
          <button
            type="button"
            className={[inline ? styles.back : styles.icon, styles.ghost].join(' ')}
            onClick={dismiss}
            disabled={!dismissible}
            aria-label={inline ? 'Назад' : 'Закрыть'}
          >
            {inline ? (
              <>
                <ChevronLeft aria-hidden="true" />
                Назад
              </>
            ) : (
              <X aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
      <PortalProvider container={dialog.ref}>
        <DefaultPropsProvider defaultProps={popupDefaults}>
          {desktopPage || chatAction ? (
            <div className={styles.panel} data-testid="dialog-content">
              {dialog.content}
            </div>
          ) : (
            dialog.content
          )}
        </DefaultPropsProvider>
      </PortalProvider>
    </dialog>
  );
};
