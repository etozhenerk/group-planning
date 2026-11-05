import styles from '@/features/message-reactions/ui/ReceiptContext/ReceiptContext.module.css';

export type ReceiptContextProps = {
  count: string | undefined;
  own: boolean;
  open: (() => void) | undefined;
};

export const ReceiptContext = ({ count, own, open }: ReceiptContextProps) =>
  own && count === undefined ? (
    <div className={styles.sent}>
      <strong>Отправлено</strong>
      <span>Подтверждения прочтения пока нет</span>
    </div>
  ) : open ? (
    <button type="button" className={styles.row} data-mobile={own} onClick={open}>
      {own && count !== undefined && BigInt(count) > 0n
        ? `Прочитали ${count}`
        : 'Кто прочитал'}
    </button>
  ) : null;
