import styles from '@/features/edit-meeting/ui/SettingsDiscard/SettingsDiscard.module.css';

export type SettingsDiscardProps = { stay: () => void; leave: () => void };

export const SettingsDiscard = ({ stay, leave }: SettingsDiscardProps) => (
  <div className={styles.confirm}>
    <p>Правки встречи не сохранятся.</p>
    <button type="button" onClick={stay}>
      Продолжить редактирование
    </button>
    <button type="button" onClick={leave}>
      Выйти без сохранения
    </button>
  </div>
);
