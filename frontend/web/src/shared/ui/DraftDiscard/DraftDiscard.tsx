import styles from '@/shared/ui/DraftDiscard/DraftDiscard.module.css';

export type DraftDiscardProps = { text: string; stay: () => void; leave: () => void };

export const DraftDiscard = ({ text, stay, leave }: DraftDiscardProps) => (
  <div className={styles.confirm}>
    <p>{text}</p>
    <button type="button" onClick={stay}>
      Продолжить редактирование
    </button>
    <button type="button" onClick={leave}>
      Выйти без сохранения
    </button>
  </div>
);
