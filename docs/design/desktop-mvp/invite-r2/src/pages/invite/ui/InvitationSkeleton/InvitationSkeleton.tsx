import styles from "@invite/pages/invite/ui/InvitationSkeleton/InvitationSkeleton.module.css";

export const InvitationSkeleton = () => (
  <main
    className={styles.content}
    role="status"
    aria-label="Загрузка приглашения"
    aria-busy="true"
  >
    <div className={styles.photo} />
    <div className={styles.details}>
      <i />
      <b />
      <b />
      <em />
      <span />
      <span />
      <span />
      <span />
      <strong />
    </div>
  </main>
);
