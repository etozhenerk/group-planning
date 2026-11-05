import { useRef } from 'react';
import { Popup } from '@gravity-ui/uikit';
import { ChatIcon } from '@/shared/ui/ChatIcon';
import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/features/send-message/ui/CompactDelivery/CompactDelivery.module.css';

export type CompactDeliveryProps = {
  open: boolean;
  change: (open: boolean) => void;
  blocked: boolean;
  error: string | null;
  retry: () => Promise<boolean>;
  restore: () => Promise<boolean>;
};

export const CompactDelivery = ({
  open,
  change,
  blocked,
  error,
  retry,
  restore,
}: CompactDeliveryProps) => {
  const trigger = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={trigger}
        className={styles.indicator}
        type="button"
        aria-label="Не удалось отправить. Действия с сообщением"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => change(!open)}
        data-testid="message-delivery"
        data-chat-surface-trigger
      >
        <ChatIcon
          name="sendError"
          size={designTokens.componentMobileChatIconSize}
          aria-hidden="true"
        />
      </button>
      <Popup
        open={open}
        onOpenChange={change}
        anchorRef={trigger}
        placement={['top-start', 'top-end', 'bottom-start']}
        modal
        returnFocus={trigger}
        aria-label="Действия с сообщением"
        data-chat-overlay="reaction"
      >
        <div className={styles.menu}>
          <button
            type="button"
            onClick={() => {
              void retry().then((done) => {
                if (done) {
                  change(false);
                }
              });
            }}
          >
            Повторить отправку
          </button>
          <button
            type="button"
            disabled={blocked}
            onClick={() => {
              void restore().then((done) => {
                if (done) {
                  change(false);
                }
              });
            }}
          >
            Вернуть текст в поле
          </button>
          {error && <p role="alert">{error}</p>}
        </div>
      </Popup>
    </>
  );
};
