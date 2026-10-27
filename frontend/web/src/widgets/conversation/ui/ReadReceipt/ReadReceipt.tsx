import styles from '@/widgets/conversation/ui/ReadReceipt/ReadReceipt.module.css';

export type ReadReceiptProps = { count: string | undefined; open: () => void };

export const ReadReceipt = ({ count, open }: ReadReceiptProps) =>
  count !== undefined && BigInt(count) > 0n ? (
    <button type="button" className={styles.receipt} onClick={open}>
      Прочитали {count}
    </button>
  ) : null;
