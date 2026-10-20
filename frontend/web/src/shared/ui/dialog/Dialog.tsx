import type { ReactNode } from 'react';
import { useId } from 'react';
import { X } from 'lucide-react';
import { preservePopupEscape } from '@/shared/ui/dialog/preservePopupEscape';
import { useDialog } from '@/shared/ui/dialog/useDialog';

export type DialogProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export const Dialog = ({ open, title, onClose, children }: DialogProps) => {
  const ref = useDialog(open);
  const heading = useId();

  return (
    <dialog
      ref={ref}
      aria-labelledby={heading}
      onCancel={onClose}
      onKeyDownCapture={preservePopupEscape}
    >
      <div className="dialog-heading">
        <h2 id={heading}>{title}</h2>
        <button
          type="button"
          className="icon ghost"
          onClick={onClose}
          aria-label="Закрыть"
        >
          <X aria-hidden="true" size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
};
