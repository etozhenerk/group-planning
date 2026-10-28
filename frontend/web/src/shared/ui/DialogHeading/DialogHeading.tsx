import type { HTMLAttributes } from 'react';
import { DialogDismissContent } from '@/shared/ui/DialogDismissContent';
import styles from '@/shared/ui/DialogHeading/DialogHeading.module.css';

export type DialogHeadingProps = {
  heading: string;
  title: string;
  inline: boolean;
  mobile: boolean;
  chatAction: boolean;
  action: boolean;
  dismissible: boolean;
  dismiss: () => void;
  region: HTMLAttributes<HTMLDivElement>;
};

export const DialogHeading = ({
  heading,
  title,
  inline,
  mobile,
  chatAction,
  action,
  dismissible,
  dismiss,
  region,
}: DialogHeadingProps) => (
  <div
    className={styles.region}
    {...region}
    data-testid="dialog-drag-region"
    data-mobile={mobile}
    data-chat-action={chatAction}
    data-action={action}
    data-inline={inline}
  >
    {mobile && (
      <button
        type="button"
        className={styles.handle}
        data-sheet-handle
        aria-label="Закрыть"
        disabled={!dismissible}
        onClick={dismiss}
      />
    )}
    <div className={styles.heading}>
      <h2 id={heading} aria-level={inline ? 1 : 2}>
        {title}
      </h2>
      {!mobile && (
        <button
          type="button"
          className={inline ? styles.back : styles.icon}
          onClick={dismiss}
          disabled={!dismissible}
          aria-label={inline ? 'Назад' : 'Закрыть'}
        >
          <DialogDismissContent inline={inline} chatAction={chatAction} />
        </button>
      )}
    </div>
  </div>
);
