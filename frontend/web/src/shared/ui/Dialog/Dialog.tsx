import styles from '@/shared/ui/Dialog/Dialog.module.css';
import type { ReactNode } from 'react';
import { useId } from 'react';
import { useBackdropDismiss } from '@/shared/ui/Dialog/hooks/useBackdropDismiss';
import { X } from 'lucide-react';
import { PortalProvider, DefaultPropsProvider } from '@gravity-ui/uikit';
import { popupDefaults } from '@/shared/ui/Dialog/lib/popupDefaults';
import { preservePopupEscape } from '@/shared/ui/Dialog/lib/preservePopupEscape';
import { useDialog } from '@/shared/ui/Dialog/hooks/useDialog';

export type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  contained?: boolean;
};

export const Dialog = ({
  open,
  title,
  onClose,
  children,
  contained = false,
}: DialogProps) => {
  const ref = useDialog(open);
  const heading = useId();
  const backdrop = useBackdropDismiss(onClose);

  return (
    <dialog
      className={[styles['dialog'], contained ? styles['contained'] : '']
        .filter(Boolean)
        .join(' ')}
      onPointerDown={backdrop.pointerDown}
      onClick={backdrop.click}
      ref={ref}
      aria-labelledby={heading}
      onCancel={onClose}
      onKeyDownCapture={preservePopupEscape}
    >
      <div className={styles['dialog-heading']}>
        <h2 id={heading}>{title}</h2>
        <button
          type="button"
          className={[styles['icon'], styles['ghost']].join(' ')}
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
      <PortalProvider container={ref}>
        <DefaultPropsProvider defaultProps={popupDefaults}>
          {children}
        </DefaultPropsProvider>
      </PortalProvider>
    </dialog>
  );
};
