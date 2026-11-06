import styles from '@/pages/profile/ui/ProfileAccountRow/ProfileAccountRow.module.css';

export type ProfileAccountRowProps = { label: string; value: string | null };

export const ProfileAccountRow = ({ label, value }: ProfileAccountRowProps) => (
  <div className={styles.row}>
    <dt>{label}</dt>
    <dd data-missing={!value?.trim()}>{value?.trim() || 'Не указано'}</dd>
  </div>
);
