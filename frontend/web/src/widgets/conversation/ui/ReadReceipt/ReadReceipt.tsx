import { designTokens } from '@/shared/config/design-tokens';
import styles from '@/widgets/conversation/ui/ReadReceipt/ReadReceipt.module.css';

export type ReadReceiptProps = {
  count: string | undefined;
  open: () => void;
  mobile?: boolean;
};

export const ReadReceipt = ({ count, open, mobile = false }: ReadReceiptProps) => {
  const read = count !== undefined && BigInt(count) > 0n;
  const label = read
    ? `Прочитали ${count}. Открыть сведения`
    : count === '0'
      ? 'Отправлено. Пока никто не прочитал. Открыть сведения'
      : 'Отправлено. Нет подтверждения прочтения. Открыть действия';

  return mobile ? (
    <button
      type="button"
      className={styles.receipt}
      data-mobile
      data-read={read}
      aria-label={label}
      title={label}
      onClick={open}
      aria-haspopup="dialog"
      data-testid="message-receipt"
    >
      <svg
        viewBox="0 0 24 18"
        fill="none"
        stroke="currentColor"
        strokeWidth={
          read
            ? designTokens.componentMobileMessageReceiptReadStroke
            : designTokens.componentMobileMessageReceiptSentStroke
        }
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="m2 9 4 4L16 3" />
        {read && <path d="m10 12 1 1L22 2" />}
      </svg>
    </button>
  ) : read ? (
    <button type="button" className={styles.receipt} onClick={open}>
      Прочитали {count}
    </button>
  ) : null;
};
