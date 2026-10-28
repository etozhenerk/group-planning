import styles from '@/shared/ui/Dialog/Dialog.module.css';
import type { ReactNode, RefObject } from 'react';
import { DialogDismissContent } from '@/shared/ui/DialogDismissContent';
import { useDialogLayout } from '@/shared/ui/Dialog/hooks/useDialogLayout';
import { PortalProvider, DefaultPropsProvider } from '@gravity-ui/uikit';
import { popupDefaults } from '@/shared/ui/Dialog/lib/popupDefaults';
import { preservePopupEscape } from '@/shared/ui/Dialog/lib/preservePopupEscape';
import { useDialog } from '@/shared/ui/Dialog/hooks/useDialog';
import { useDialogControls } from '@/shared/ui/Dialog/hooks/useDialogControls';
import { dialogClassName } from '@/shared/ui/Dialog/lib/dialogClassName';

export type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  contained?: boolean;
  dismissible?: boolean;
  desktopPage?: boolean;
  chatAction?: boolean;
  formLayout?: boolean;
  returnFocus?: RefObject<HTMLElement | null> | undefined;
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
  formLayout = false,
  returnFocus,
}: DialogProps) => {
  const { inline, tablet, mobile, compact } = useDialogLayout(desktopPage);
  const dialog = useDialog(open, title, children, formLayout, !inline, returnFocus);
  const { region, heading, backdrop, dismiss, cancel } = useDialogControls(
    dialog.ref,
    onClose,
    dismissible,
    inline,
    open,
  );

  return (
    <dialog
      className={dialogClassName({ contained, inline, tablet, desktopPage, chatAction })}
      onPointerDown={backdrop.pointerDown}
      onClick={backdrop.click}
      ref={dialog.ref}
      data-mobile={mobile}
      data-chat-action={chatAction}
      data-compact={compact}
      role={inline ? 'main' : undefined}
      aria-labelledby={heading}
      id={inline && open ? 'main' : undefined}
      onCancel={cancel}
      onKeyDownCapture={preservePopupEscape}
    >
      <div className={styles['drag-region']} {...region} data-testid="dialog-drag-region">
        <div className={styles['dialog-heading']}>
          <h2 id={heading} aria-level={inline ? 1 : 2}>
            {dialog.title}
          </h2>
          <button
            type="button"
            className={[inline ? styles.back : styles.icon, styles.ghost].join(' ')}
            onClick={dismiss}
            disabled={!dismissible}
            aria-label={inline ? 'Назад' : 'Закрыть'}
          >
            <DialogDismissContent inline={inline} chatAction={chatAction} />
          </button>
        </div>
      </div>
      <PortalProvider container={dialog.ref}>
        <DefaultPropsProvider defaultProps={popupDefaults}>
          {desktopPage || chatAction ? (
            <div
              className={[
                styles.panel,
                dialog.formLayout ? styles['form-panel'] : '',
              ].join(' ')}
              data-testid="dialog-content"
            >
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
