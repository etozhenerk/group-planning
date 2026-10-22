import styles from '@/pages/meetings/ui/MeetingsLoading/MeetingsLoading.module.css';

export const MeetingsLoading = () => {
  return (
    <div role="status" aria-busy="true" className={styles.loading}>
      <h2>Загружаем встречи…</h2>
      <div aria-hidden="true" className={styles.skeleton} />
      <div aria-hidden="true" className={styles.skeleton} />
    </div>
  );
};
